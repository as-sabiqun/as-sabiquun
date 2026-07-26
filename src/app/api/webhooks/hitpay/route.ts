import { parseHitPayWebhook, ProviderError, readBody, sha256Hex, verifyHitPaySignature } from "@/lib/integrations/providers";
import { processHitPayWebhook, recordIntegrationFailure } from "@/lib/integrations/store";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const salt = process.env.HITPAY_WEBHOOK_SALT;
  if (!salt) return Response.json({ error: "Webhook is not configured." }, { status: 503 });

  let payloadHash: string | null = null;
  try {
    const raw = await readBody(request, 1_000_000);
    payloadHash = sha256Hex(raw);
    if (!verifyHitPaySignature(raw, request.headers.get("hitpay-signature"), salt)) {
      await recordIntegrationFailure(createAdminClient(), { provider: "hitpay", failureKind: "invalid_signature", detail: "HitPay signature validation failed.", payloadHash }).catch(() => undefined);
      return Response.json({ error: "Invalid signature." }, { status: 401 });
    }

    const event = parseHitPayWebhook(
      raw,
      request.headers.get("hitpay-event-type"),
      request.headers.get("hitpay-event-object"),
    );
    await processHitPayWebhook(createAdminClient(), event);
    return Response.json({ received: true });
  } catch (error) {
    if (error instanceof ProviderError && error.code === "unsupported_event") {
      return Response.json({ received: true, ignored: true }, { status: 202 });
    }
    console.error("HitPay webhook failed", error);
    await recordIntegrationFailure(createAdminClient(), { provider: "hitpay", failureKind: error instanceof ProviderError ? error.code : "processing_failed", detail: error instanceof Error ? error.message : "Unknown HitPay webhook failure.", payloadHash }).catch(() => undefined);
    if (error instanceof ProviderError && ["invalid_json", "invalid_payload", "invalid_amount", "body_too_large"].includes(error.code)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
