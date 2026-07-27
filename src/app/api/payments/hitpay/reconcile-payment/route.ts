import { getAal2AdminAtLeast } from "@/lib/auth";
import {
  findHitPayPaymentRequestsByReference,
  parseJson,
  ProviderError,
  readBody,
} from "@/lib/integrations/providers";
import {
  failHitPayPaymentCreation,
  recordHitPayPaymentRequest,
  releaseHitPayPaymentReconciliation,
} from "@/lib/integrations/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONABLE = new Set(["pending", "completed"]);

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function POST(request: Request) {
  try {
    const session = await createClient();
    if (!(await getAal2AdminAtLeast(session, "administrator"))) {
      return Response.json({ error: "Administrator finance access is required." }, { status: 403 });
    }
    const apiKey = process.env.HITPAY_API_KEY;
    if (!apiKey) return Response.json({ error: "HitPay reconciliation is not configured." }, { status: 503 });
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return Response.json({ error: "Content-Type must be application/json." }, { status: 415 });
    }

    const body = parseJson(await readBody(request, 2_000));
    const input = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
    const transactionId = typeof input.transactionId === "string" ? input.transactionId : "";
    const releaseIfMissing = input.releaseIfMissing === true;
    if (!UUID.test(transactionId)) return Response.json({ error: "A valid payment transaction is required." }, { status: 400 });

    const admin = createAdminClient();
    const { data: transaction } = await admin
      .from("payment_transactions")
      .select("id, order_id, amount, currency, status, provider_request_id, orders(reference)")
      .eq("id", transactionId)
      .eq("transaction_type", "payment")
      .maybeSingle();
    const order = one(transaction?.orders as { reference: string } | Array<{ reference: string }> | null);
    if (!transaction || !order || !["pending", "reconciliation_required"].includes(transaction.status)) {
      return Response.json({ error: "This payment request is not awaiting reconciliation." }, { status: 409 });
    }

    const requests = await findHitPayPaymentRequestsByReference(order.reference, {
      apiKey,
      environment: process.env.HITPAY_ENV,
    });
    const valid = requests.filter((candidate) => (
      candidate.amountCents === transaction.amount
      && candidate.currency === transaction.currency
      && candidate.metadataOrderId === transaction.order_id
    ));
    if (requests.length !== valid.length) {
      return Response.json({ error: "HitPay returned a request with the same reference but different commercial details." }, { status: 409 });
    }

    const knownProviderId = transaction.provider_request_id.startsWith("reservation:")
      ? null
      : transaction.provider_request_id;
    const relevant = knownProviderId ? valid.filter((candidate) => candidate.id === knownProviderId) : valid;
    const actionable = relevant.filter((candidate) => ACTIONABLE.has(candidate.status));
    if (actionable.length > 1) {
      return Response.json({ error: "More than one live HitPay checkout exists for this order. Resolve it in HitPay before continuing." }, { status: 409 });
    }
    if (actionable.length === 1) {
      const found = actionable[0];
      const expiresAt = found.expiresAt && new Date(found.expiresAt) > new Date()
        ? found.expiresAt
        : new Date(Date.now() + 5 * 60_000).toISOString();
      await recordHitPayPaymentRequest(admin, {
        transactionId,
        providerRequestId: found.id,
        checkoutUrl: found.url,
        expiresAt,
      });
      return Response.json({
        reconciled: true,
        checkoutUrl: found.status === "pending" ? found.url : null,
        message: found.status === "completed"
          ? "The HitPay request is completed. Payment remains gated on its signed webhook."
          : "The existing HitPay checkout was restored without creating another request.",
      });
    }

    if (knownProviderId && relevant.some((candidate) => !ACTIONABLE.has(candidate.status))) {
      await failHitPayPaymentCreation(admin, {
        transactionId,
        errorMessage: `HitPay reconciliation found terminal request ${knownProviderId}.`,
      });
      return Response.json({ reconciled: true, message: "The terminal HitPay request was released. The customer may create a new checkout." });
    }
    if (!releaseIfMissing) {
      return Response.json({
        pending: true,
        canRelease: true,
        message: "No matching live HitPay request was found. Confirm release to let the customer try again.",
      }, { status: 202 });
    }
    await releaseHitPayPaymentReconciliation(session, {
      transactionId,
      reason: "AAL2 administrator confirmed that HitPay has no matching live payment request.",
    });
    return Response.json({ reconciled: true, message: "The unmatched creation attempt was released. The customer may create a new checkout." });
  } catch (error) {
    console.error("HitPay payment-request reconciliation failed", error);
    if (error instanceof ProviderError && ["invalid_json", "body_too_large"].includes(error.code)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "The payment request could not be reconciled from HitPay." }, { status: 502 });
  }
}
