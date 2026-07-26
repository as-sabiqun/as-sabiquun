import { bearerMatches, parseBrevoWebhook, ProviderError, readBody, secretsMatch, sha256Hex } from "@/lib/integrations/providers";
import { processBrevoWebhook, recordIntegrationFailure } from "@/lib/integrations/store";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.BREVO_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  const authorized = bearerMatches(request.headers.get("authorization"), secret)
    || secretsMatch(request.headers.get("x-brevo-webhook-secret"), secret);
  if (!authorized) {
    await recordIntegrationFailure(createAdminClient(), { provider: "brevo", failureKind: "invalid_credentials", detail: "Brevo webhook credential validation failed." }).catch(() => undefined);
    return Response.json({ error: "Invalid webhook credentials." }, { status: 401 });
  }

  let payloadHash: string | null = null;
  try {
    const raw = await readBody(request, 512_000);
    payloadHash = sha256Hex(raw);
    const events = parseBrevoWebhook(raw);
    const admin = createAdminClient();
    for (const event of events) await processBrevoWebhook(admin, event);
    return Response.json({ received: events.length });
  } catch (error) {
    console.error("Brevo webhook failed", error);
    await recordIntegrationFailure(createAdminClient(), { provider: "brevo", failureKind: error instanceof ProviderError ? error.code : "processing_failed", detail: error instanceof Error ? error.message : "Unknown Brevo webhook failure.", payloadHash }).catch(() => undefined);
    if (error instanceof ProviderError && ["invalid_json", "invalid_payload", "body_too_large"].includes(error.code)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
