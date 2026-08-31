import { parseAirwallexRefundWebhook, parseAirwallexWebhook, verifyAirwallexWebhookSignature } from "@/lib/integrations/airwallex";
import { ProviderError, readBody, sha256Hex } from "@/lib/integrations/providers";
import { processAirwallexRefundWebhook, processAirwallexWebhook, recordIntegrationFailure } from "@/lib/integrations/store";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.AIRWALLEX_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Airwallex webhook is not configured." }, { status: 503 });

  let payloadHash: string | null = null;
  try {
    const raw = await readBody(request, 1_000_000);
    payloadHash = sha256Hex(raw);
    if (!verifyAirwallexWebhookSignature({
      raw,
      timestamp: request.headers.get("x-timestamp"),
      signature: request.headers.get("x-signature"),
      secret,
    })) {
      await recordIntegrationFailure(createAdminClient(), {
        provider: "airwallex",
        failureKind: "invalid_signature",
        detail: "Airwallex signature or timestamp validation failed.",
        payloadHash,
      }).catch(() => undefined);
      return Response.json({ error: "Invalid signature." }, { status: 401 });
    }

    let event;
    try {
      event = parseAirwallexWebhook(raw);
    } catch (error) {
      if (!(error instanceof ProviderError) || error.code !== "unsupported_event") throw error;
      event = parseAirwallexRefundWebhook(raw);
    }
    const expectedAccount = process.env.AIRWALLEX_ACCOUNT_ID?.trim();
    if (expectedAccount && event.accountId !== expectedAccount) {
      throw new ProviderError("Airwallex event belongs to a different account.", "account_mismatch");
    }
    if ("refundId" in event) await processAirwallexRefundWebhook(createAdminClient(), event);
    else await processAirwallexWebhook(createAdminClient(), event);
    return Response.json({ received: true });
  } catch (error) {
    if (error instanceof ProviderError && error.code === "unsupported_event") {
      return Response.json({ received: true, ignored: true });
    }
    console.error("Airwallex webhook failed", {
      code: error instanceof ProviderError ? error.code : "processing_failed",
      payloadHash,
    });
    await recordIntegrationFailure(createAdminClient(), {
      provider: "airwallex",
      failureKind: error instanceof ProviderError ? error.code : "processing_failed",
      detail: error instanceof Error ? error.message : "Unknown Airwallex webhook failure.",
      payloadHash,
    }).catch(() => undefined);
    if (error instanceof ProviderError && ["invalid_json", "invalid_payload", "invalid_amount", "body_too_large", "account_mismatch"].includes(error.code)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
