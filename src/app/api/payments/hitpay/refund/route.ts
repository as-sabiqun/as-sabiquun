import { getAal2Admin } from "@/lib/auth";
import { createHitPayRefund, decimalToCents, parseJson, ProviderError, readBody } from "@/lib/integrations/providers";
import {
  markHitPayRefundReconciliationRequired,
  prepareHitPayRefund,
  recordHitPayRefundResult,
  type PreparedRefund,
} from "@/lib/integrations/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let reservation: PreparedRefund | null = null;
  let providerCallStarted = false;

  try {
    const session = await createClient();
    if (!(await getAal2Admin(session))) {
      return Response.json({ error: "A verified administrator session is required." }, { status: 403 });
    }
    const apiKey = process.env.HITPAY_API_KEY;
    if (!apiKey) return Response.json({ error: "HitPay refunds are not configured." }, { status: 503 });
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return Response.json({ error: "Content-Type must be application/json." }, { status: 415 });
    }

    const body = parseJson(await readBody(request, 5_000));
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return Response.json({ error: "A valid refund request is required." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const orderId = typeof input.orderId === "string" ? input.orderId : "";
    const amount = typeof input.amount === "string" ? input.amount.trim() : "";
    const reason = typeof input.reason === "string" ? input.reason.trim() : "";
    const confirmFulfilmentStarted = input.confirmFulfilmentStarted === true;
    if (!UUID.test(orderId)) return Response.json({ error: "A valid order ID is required." }, { status: 400 });
    if (!reason || reason.length > 1_000) {
      return Response.json({ error: "A refund reason of up to 1,000 characters is required." }, { status: 400 });
    }

    const amountCents = decimalToCents(amount);
    if (amountCents <= 0) throw new ProviderError("Refund amount must be greater than zero.", "invalid_amount");
    reservation = await prepareHitPayRefund(session, { orderId, amountCents, reason, confirmFulfilmentStarted });

    providerCallStarted = true;
    const refund = await createHitPayRefund({ paymentId: reservation.paymentId, amountCents: reservation.amountCents }, {
      apiKey,
      environment: process.env.HITPAY_ENV,
    });

    try {
      await recordHitPayRefundResult(createAdminClient(), {
        transactionId: reservation.transactionId,
        providerRefundId: refund.id,
        accepted: true,
        payload: refund.payload,
      });
    } catch (error) {
      console.error("HitPay refund needs reconciliation", {
        orderId: reservation.orderId,
        transactionId: reservation.transactionId,
        providerRefundId: refund.id,
        error,
      });
      await markHitPayRefundReconciliationRequired(createAdminClient(), {
        transactionId: reservation.transactionId,
        providerRefundId: refund.id,
        errorMessage: error instanceof Error ? error.message : "The provider refund could not be recorded locally.",
        payload: refund.payload,
      }).catch((recordError) => console.error("HitPay refund reconciliation state could not be persisted", recordError));
      return Response.json({
        pending: true,
        reconciliationRequired: true,
        message: "HitPay accepted the request, but its local record needs administrator review. Do not retry it.",
      }, { status: 202 });
    }

    return Response.json({
      pending: true,
      providerRefundId: refund.id,
      message: "HitPay accepted the refund. The signed webhook will confirm the final balance.",
    }, { status: 202 });
  } catch (error) {
    if (reservation && providerCallStarted && (!(error instanceof ProviderError) || error.retryable)) {
      console.error("HitPay refund outcome is uncertain", { orderId: reservation.orderId, transactionId: reservation.transactionId, error });
      await markHitPayRefundReconciliationRequired(createAdminClient(), {
        transactionId: reservation.transactionId,
        errorMessage: error instanceof Error ? error.message : "HitPay did not return a definitive result.",
      }).catch((recordError) => console.error("HitPay refund reconciliation state could not be persisted", recordError));
      return Response.json({
        pending: true,
        reconciliationRequired: true,
        message: "HitPay did not return a definitive result. Do not retry this refund until it has been reviewed.",
      }, { status: 202 });
    }

    if (reservation && error instanceof ProviderError) {
      try {
        await recordHitPayRefundResult(createAdminClient(), {
          transactionId: reservation.transactionId,
          providerRefundId: null,
          accepted: false,
          errorMessage: error.message,
        });
      } catch (recordError) {
        console.error("HitPay refund rejection could not be recorded", { transactionId: reservation.transactionId, recordError });
      }
    }

    if (error instanceof ProviderError && ["invalid_json", "body_too_large", "invalid_amount"].includes(error.code)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ProviderError && error.code === "refund_not_allowed") {
      return Response.json({ error: error.message }, { status: 409 });
    }
    console.error("HitPay refund request failed", error);
    return Response.json({ error: error instanceof ProviderError ? error.message : "HitPay could not process this refund." }, { status: 502 });
  }
}
