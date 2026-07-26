import { createHitPayPaymentRequest, parseJson, ProviderError, readBody, type HitPayPaymentRequest } from "@/lib/integrations/providers";
import { isGoogleCustomer } from "@/lib/auth";
import {
  failHitPayPaymentCreation,
  markHitPayPaymentReconciliationRequired,
  prepareHitPayPayment,
  recordHitPayPaymentRequest,
  type PreparedPayment,
} from "@/lib/integrations/store";
import { getSiteUrl } from "@/lib/site-url";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getProfile } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let payment: PreparedPayment | null = null;
  let providerCallStarted = false;
  let created: HitPayPaymentRequest | null = null;

  try {
    const apiKey = process.env.HITPAY_API_KEY;
    if (!apiKey) return Response.json({ error: "Payments are not configured." }, { status: 503 });
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return Response.json({ error: "Content-Type must be application/json." }, { status: 415 });
    }

    const body = parseJson(await readBody(request, 10_000));
    const orderId = typeof body === "object" && body !== null && "orderId" in body ? String(body.orderId) : "";
    if (!UUID.test(orderId)) return Response.json({ error: "A valid order ID is required." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Sign in to continue." }, { status: 401 });
    const profile = await getProfile(supabase, user.id);
    if (!await isGoogleCustomer(supabase, user, profile)) {
      return Response.json({ error: "A verified Google customer account is required." }, { status: 403 });
    }
    if (!await consumeRateLimit("checkout", `${user.id}:${orderId}`, 10, 600)) {
      return Response.json({ error: "Too many checkout attempts. Please wait before trying again." }, {
        status: 429,
        headers: { "Retry-After": "600" },
      });
    }

    payment = await prepareHitPayPayment(supabase, orderId);
    if (payment.checkoutUrl) {
      return Response.json({
        checkoutUrl: payment.checkoutUrl,
        expiresAt: payment.expiresAt,
        reused: true,
        reconciliationRequired: payment.reconciliationRequired,
      });
    }
    if (payment.reconciliationRequired) {
      return Response.json({
        error: "This checkout needs administrator reconciliation before another HitPay request can be created.",
        reconciliationRequired: true,
      }, { status: 409 });
    }
    if (payment.creating) {
      return Response.json({ error: "Your secure checkout is being prepared. Please retry shortly." }, {
        status: 409,
        headers: { "Retry-After": "2" },
      });
    }
    if (!payment.shouldCreate) {
      throw new ProviderError("The payment reservation is not ready.", "database_error", true);
    }

    const siteUrl = await getSiteUrl();
    providerCallStarted = true;
    created = await createHitPayPaymentRequest({
      orderId: payment.orderId,
      reference: payment.reference,
      amountCents: payment.amountCents,
      currency: payment.currency,
      customerName: payment.customerName,
      customerEmail: payment.customerEmail,
      customerPhone: payment.customerPhone,
      redirectUrl: `${siteUrl}/dashboard/orders/${encodeURIComponent(payment.reference)}?payment=processing`,
    }, { apiKey, environment: process.env.HITPAY_ENV });
    const expiresAt = created.expiresAt ?? new Date(Date.now() + 30 * 60_000).toISOString();

    try {
      await recordHitPayPaymentRequest(createAdminClient(), {
        transactionId: payment.transactionId,
        providerRequestId: created.id,
        checkoutUrl: created.url,
        expiresAt,
      });
    } catch (error) {
      console.error("HitPay request needs reconciliation", { orderId: payment.orderId, providerRequestId: created.id });
      await markHitPayPaymentReconciliationRequired(createAdminClient(), {
        transactionId: payment.transactionId,
        providerRequestId: created.id,
        checkoutUrl: created.url,
        expiresAt,
        errorMessage: error instanceof Error ? error.message : "The provider request could not be recorded locally.",
      }).catch((recordError) => console.error("HitPay reconciliation state could not be persisted", recordError));
      return Response.json({
        checkoutUrl: created.url,
        expiresAt,
        reused: false,
        reconciliationRequired: true,
      });
    }

    return Response.json({ checkoutUrl: created.url, expiresAt, reused: false });
  } catch (error) {
    console.error("HitPay payment request failed", error);
    if (payment) {
      const uncertain = providerCallStarted && (!(error instanceof ProviderError) || error.retryable);
      try {
        if (uncertain) {
          await markHitPayPaymentReconciliationRequired(createAdminClient(), {
            transactionId: payment.transactionId,
            providerRequestId: created?.id ?? null,
            checkoutUrl: created?.url ?? null,
            expiresAt: created?.expiresAt ?? null,
            errorMessage: error instanceof Error ? error.message : "HitPay did not return a definitive result.",
          });
        } else {
          await failHitPayPaymentCreation(createAdminClient(), {
            transactionId: payment.transactionId,
            errorMessage: error instanceof Error ? error.message : "The payment request was not sent.",
          });
        }
      } catch (recordError) {
        console.error("HitPay payment creation outcome could not be recorded", recordError);
      }
      if (uncertain) {
        return Response.json({
          pending: true,
          reconciliationRequired: true,
          message: "HitPay did not return a definitive result. A new checkout is blocked until this attempt is reconciled.",
        }, { status: 202 });
      }
    }
    if (error instanceof ProviderError && ["invalid_json", "body_too_large"].includes(error.code)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ProviderError && error.code === "payment_not_payable") {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return Response.json({ error: "Secure checkout could not be created. Please try again." }, { status: 502 });
  }
}
