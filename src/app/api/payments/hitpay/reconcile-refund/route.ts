import { createHash } from "node:crypto";
import { getAal2AdminAtLeast } from "@/lib/auth";
import { getHitPayCharge, parseJson, ProviderError, readBody } from "@/lib/integrations/providers";
import { processHitPayWebhook, releaseHitPayRefundReconciliation } from "@/lib/integrations/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function POST(request: Request) {
  try {
    const session = await createClient();
    if (!(await getAal2AdminAtLeast(session, "administrator"))) return Response.json({ error: "Administrator finance access is required." }, { status: 403 });
    const apiKey = process.env.HITPAY_API_KEY;
    if (!apiKey) return Response.json({ error: "HitPay reconciliation is not configured." }, { status: 503 });
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return Response.json({ error: "Content-Type must be application/json." }, { status: 415 });
    }
    const body = parseJson(await readBody(request, 2_000));
    const input = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
    const transactionId = typeof input.transactionId === "string" ? input.transactionId : "";
    const releaseIfUnchanged = input.releaseIfUnchanged === true;
    if (!UUID.test(transactionId)) return Response.json({ error: "A valid refund transaction is required." }, { status: 400 });

    const admin = createAdminClient();
    const { data: refund } = await admin
      .from("payment_transactions")
      .select("id, order_id, amount, currency, status, orders(reference)")
      .eq("id", transactionId)
      .eq("transaction_type", "refund")
      .maybeSingle();
    const order = one(refund?.orders as { reference: string } | Array<{ reference: string }> | null);
    if (!refund || !order || !["pending", "reconciliation_required"].includes(refund.status)) {
      return Response.json({ error: "This refund is not awaiting reconciliation." }, { status: 409 });
    }

    const { data: payment } = await admin
      .from("payment_transactions")
      .select("provider_request_id, provider_payment_id")
      .eq("order_id", refund.order_id)
      .eq("transaction_type", "payment")
      .eq("status", "succeeded")
      .not("provider_payment_id", "is", null)
      .order("provider_event_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!payment?.provider_payment_id) return Response.json({ error: "The captured HitPay charge is unavailable." }, { status: 409 });

    const charge = await getHitPayCharge(payment.provider_payment_id, { apiKey, environment: process.env.HITPAY_ENV });
    if (charge.id !== payment.provider_payment_id || charge.currency !== refund.currency) {
      return Response.json({ error: "HitPay returned a charge that does not match this transaction." }, { status: 409 });
    }
    if (charge.paymentRequestId && charge.paymentRequestId !== payment.provider_request_id) {
      return Response.json({ error: "HitPay returned a different payment request." }, { status: 409 });
    }
    if (charge.orderReference && charge.orderReference !== order.reference) {
      return Response.json({ error: "HitPay returned a different order reference." }, { status: 409 });
    }
    const { data: recordedRefunds, error: refundLedgerError } = await admin
      .from("payment_transactions")
      .select("amount")
      .eq("order_id", refund.order_id)
      .eq("transaction_type", "refund")
      .eq("status", "succeeded");
    if (refundLedgerError) return Response.json({ error: "The refund ledger could not be read." }, { status: 503 });
    const recordedRefundedAmount = (recordedRefunds ?? []).reduce((sum, row) => sum + row.amount, 0);
    if (charge.refundedAmountCents < recordedRefundedAmount) {
      return Response.json({ error: "HitPay returned a refund total below the confirmed local ledger." }, { status: 409 });
    }
    if (charge.refundedAmountCents === recordedRefundedAmount) {
      if (!releaseIfUnchanged) {
        return Response.json({
          pending: true,
          canRelease: true,
          message: "HitPay has no additional refund. Confirm release only after reviewing the provider record.",
        }, { status: 202 });
      }
      await releaseHitPayRefundReconciliation(session, {
        transactionId,
        confirmedRefundedAmountCents: charge.refundedAmountCents,
        reason: "AAL2 administrator confirmed that HitPay has no additional refund for this attempt.",
      });
      return Response.json({ reconciled: true, message: "The no-change refund attempt was released without changing the customer balance." });
    }

    await processHitPayWebhook(admin, {
      eventType: "refund.charge_reconciled",
      eventObject: "charge",
      providerRequestId: payment.provider_request_id,
      reference: order.reference,
      status: "succeeded",
      amountCents: charge.refundedAmountCents,
      currency: charge.currency,
      payload: charge.payload,
      payloadHash: createHash("sha256").update(`charge-reconcile:${charge.id}:${charge.refundedAmountCents}`).digest("hex"),
    });
    return Response.json({ reconciled: true, message: "The provider-confirmed refund balance was reconciled." });
  } catch (error) {
    console.error("HitPay refund reconciliation failed", error);
    if (error instanceof ProviderError && ["invalid_json", "body_too_large"].includes(error.code)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "The refund could not be reconciled from HitPay." }, { status: 502 });
  }
}
