import { getAal2AdminAtLeast } from "@/lib/auth";
import { createAirwallexRefund } from "@/lib/integrations/airwallex";
import { decimalToCents, parseJson, ProviderError, readBody } from "@/lib/integrations/providers";
import { prepareAirwallexRefund, recordAirwallexRefund } from "@/lib/integrations/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const session = await createClient();
    if (!(await getAal2AdminAtLeast(session, "administrator"))) {
      return Response.json({ error: "Administrator finance access is required." }, { status: 403 });
    }
    const clientId = process.env.AIRWALLEX_CLIENT_ID;
    const apiKey = process.env.AIRWALLEX_API_KEY;
    if (!clientId || !apiKey) return Response.json({ error: "Airwallex refunds are not configured." }, { status: 503 });
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
    if (!UUID.test(orderId)) return Response.json({ error: "A valid order ID is required." }, { status: 400 });
    if (!reason || reason.length > 128) return Response.json({ error: "A refund reason of up to 128 characters is required." }, { status: 400 });
    const amountCents = decimalToCents(amount);
    if (amountCents <= 0) throw new ProviderError("Refund amount must be greater than zero.", "invalid_amount");

    const reservation = await prepareAirwallexRefund(session, {
      orderId,
      amountCents,
      reason,
      confirmFulfilmentStarted: input.confirmFulfilmentStarted === true,
    });
    const refund = await createAirwallexRefund({
      paymentIntentId: reservation.paymentIntentId,
      requestId: reservation.requestId,
      amountCents: reservation.amountCents,
      reason: reservation.reason,
    }, { clientId, apiKey, environment: process.env.AIRWALLEX_ENV });
    if (
      refund.requestId !== reservation.requestId
      || refund.paymentIntentId !== reservation.paymentIntentId
      || refund.amountCents !== reservation.amountCents
      || refund.currency !== reservation.currency
    ) throw new ProviderError("Airwallex returned a refund that does not match the reservation.", "refund_mismatch");
    await recordAirwallexRefund(createAdminClient(), {
      transactionId: reservation.transactionId,
      requestId: reservation.requestId,
      refundId: refund.id,
      providerStatus: refund.status,
      payload: refund.payload,
    });
    return Response.json({
      pending: true,
      providerRefundId: refund.id,
      message: "Airwallex accepted the refund. Its signed webhook will confirm the customer balance.",
    }, { status: 202 });
  } catch (error) {
    if (error instanceof ProviderError && ["invalid_json", "body_too_large", "invalid_amount"].includes(error.code)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ProviderError && error.code === "refund_not_allowed") {
      return Response.json({ error: error.message }, { status: 409 });
    }
    console.error("Airwallex refund request failed", { code: error instanceof ProviderError ? error.code : "unknown" });
    return Response.json({ error: "Airwallex could not process this refund. The idempotent reservation remains safe to retry." }, { status: 502 });
  }
}
