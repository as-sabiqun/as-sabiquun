import { retrieveAirwallexPaymentIntent, type AirwallexNormalizedStatus } from "@/lib/integrations/airwallex";
import { ProviderError, sha256Hex } from "@/lib/integrations/providers";
import { processAirwallexWebhook } from "@/lib/integrations/store";
import { isCustomerAccount } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getProfile } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalized(status: string): AirwallexNormalizedStatus {
  if (status === "SUCCEEDED") return "succeeded";
  if (status === "CANCELLED") return "cancelled";
  return "pending";
}

export async function POST(request: Request) {
  try {
    const clientId = process.env.AIRWALLEX_CLIENT_ID;
    const apiKey = process.env.AIRWALLEX_API_KEY;
    if (!clientId || !apiKey) return Response.json({ error: "Airwallex is not configured." }, { status: 503 });
    const body = await request.json() as { orderId?: unknown };
    const orderId = String(body.orderId ?? "");
    if (!UUID.test(orderId)) return Response.json({ error: "A valid order ID is required." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Sign in to continue." }, { status: 401 });
    const profile = await getProfile(supabase, user.id);
    if (!await isCustomerAccount(supabase, user, profile)) return Response.json({ error: "Customer access is required." }, { status: 403 });

    const { data: visibleOrder } = await supabase
      .from("customer_orders")
      .select("id,reference,total_amount,currency,payment_status")
      .eq("id", orderId)
      .maybeSingle();
    if (!visibleOrder) return Response.json({ error: "Order not found." }, { status: 404 });
    const admin = createAdminClient();
    const { data: providerRow } = await admin.from("orders").select("payment_provider").eq("id", orderId).single();
    if (providerRow?.payment_provider !== "airwallex") return Response.json({ status: visibleOrder.payment_status });
    const { data: transaction, error } = await admin
      .from("payment_transactions")
      .select("provider_request_id")
      .eq("order_id", orderId)
      .eq("provider", "airwallex")
      .eq("transaction_type", "payment")
      .like("provider_request_id", "int_%")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error("Payment status could not be read.");
    if (!transaction) return Response.json({ status: "pending" });

    const intent = await retrieveAirwallexPaymentIntent(transaction.provider_request_id, {
      clientId,
      apiKey,
      environment: process.env.AIRWALLEX_ENV,
    });
    if (
      intent.merchantOrderId !== visibleOrder.reference
      || intent.amountCents !== visibleOrder.total_amount
      || intent.currency !== visibleOrder.currency
    ) throw new ProviderError("Airwallex returned a PaymentIntent that does not match this order.", "intent_mismatch");

    const providerEventAt = intent.updatedAt ?? intent.createdAt ?? new Date().toISOString();
    const fingerprint = sha256Hex(`${intent.id}:${intent.status}:${providerEventAt}`);
    await processAirwallexWebhook(admin, {
      eventId: `retrieve:${fingerprint}`,
      eventType: `payment_intent.${intent.status.toLowerCase()}`,
      accountId: null,
      providerEventAt,
      providerRequestId: intent.id,
      reference: intent.merchantOrderId,
      status: normalized(intent.status),
      providerStatus: intent.status,
      amountCents: intent.amountCents,
      currency: intent.currency,
      payloadHash: sha256Hex(JSON.stringify(intent.payload)),
      payload: intent.payload,
    });
    return Response.json({ status: normalized(intent.status), providerStatus: intent.status });
  } catch (error) {
    console.error("Airwallex status reconciliation failed", { code: error instanceof ProviderError ? error.code : "unknown" });
    return Response.json({ error: "Payment confirmation is taking longer than usual." }, { status: 502 });
  }
}
