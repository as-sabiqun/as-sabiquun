import { createAirwallexPaymentIntent, airwallexClientEnvironment } from "@/lib/integrations/airwallex";
import { parseJson, ProviderError, readBody } from "@/lib/integrations/providers";
import { prepareAirwallexPayment, recordAirwallexPaymentIntent, type PreparedAirwallexPayment } from "@/lib/integrations/store";
import { isCustomerAccount } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getProfile } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let prepared: PreparedAirwallexPayment | null = null;
  try {
    const clientId = process.env.AIRWALLEX_CLIENT_ID;
    const apiKey = process.env.AIRWALLEX_API_KEY;
    if (!clientId || !apiKey) {
      return Response.json({ error: "Airwallex payments are not configured yet." }, { status: 503 });
    }
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
    if (!await isCustomerAccount(supabase, user, profile)) {
      return Response.json({ error: "A verified customer account is required." }, { status: 403 });
    }
    if (!await consumeRateLimit("checkout", `${user.id}:${orderId}`, 10, 600)) {
      return Response.json({ error: "Too many checkout attempts. Please wait before trying again." }, {
        status: 429,
        headers: { "Retry-After": "600" },
      });
    }

    prepared = await prepareAirwallexPayment(supabase, orderId);
    const siteUrl = await getSiteUrl();
    const intent = await createAirwallexPaymentIntent({
      orderId: prepared.orderId,
      reference: prepared.reference,
      requestId: prepared.requestId,
      amountCents: prepared.amountCents,
      currency: prepared.currency,
      returnUrl: `${siteUrl}/dashboard/orders/${encodeURIComponent(prepared.reference)}?payment=checking`,
    }, { clientId, apiKey, environment: process.env.AIRWALLEX_ENV });

    if (
      intent.requestId !== prepared.requestId
      || intent.merchantOrderId !== prepared.reference
      || intent.amountCents !== prepared.amountCents
      || intent.currency !== prepared.currency
      || !intent.clientSecret
    ) throw new ProviderError("Airwallex returned a PaymentIntent that does not match this order.", "intent_mismatch");

    await recordAirwallexPaymentIntent(createAdminClient(), {
      transactionId: prepared.transactionId,
      requestId: prepared.requestId,
      providerIntentId: intent.id,
      providerStatus: intent.status,
      expiresAt: prepared.expiresAt,
      payload: intent.payload,
    });

    return Response.json({
      intentId: intent.id,
      clientSecret: intent.clientSecret,
      currency: intent.currency,
      environment: airwallexClientEnvironment(process.env.AIRWALLEX_ENV),
      successUrl: `${siteUrl}/dashboard/orders/${encodeURIComponent(prepared.reference)}?payment=checking`,
      cancelUrl: `${siteUrl}/checkout/${encodeURIComponent(prepared.reference)}?payment=cancelled`,
      logoUrl: `${siteUrl}/brand/as-sabiquun-seal.png`,
      shopperName: prepared.customerName,
      shopperEmail: prepared.customerEmail,
      shopperPhone: prepared.customerPhone,
    });
  } catch (error) {
    console.error("Airwallex PaymentIntent creation failed", {
      orderId: prepared?.orderId,
      code: error instanceof ProviderError ? error.code : "unknown",
    });
    if (error instanceof ProviderError && ["invalid_json", "body_too_large"].includes(error.code)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ProviderError && error.code === "payment_not_payable") {
      return Response.json({ error: error.message }, { status: 409 });
    }
    // Airwallex create is idempotent by request_id. Keep the reservation so the
    // next attempt safely retries the same provider operation after timeouts.
    return Response.json({ error: "Secure Airwallex checkout could not be prepared. Please try again." }, { status: 502 });
  }
}
