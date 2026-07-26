import {
  parseJson,
  parseTelegramStart,
  ProviderError,
  readBody,
  secretsMatch,
  sendTelegramMessage,
  sha256Hex,
} from "@/lib/integrations/providers";
import { consumeTelegramLinkToken, recordIntegrationFailure } from "@/lib/integrations/store";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!webhookSecret || !botToken) return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  if (!secretsMatch(request.headers.get("x-telegram-bot-api-secret-token"), webhookSecret)) {
    await recordIntegrationFailure(createAdminClient(), { provider: "telegram", failureKind: "invalid_credentials", detail: "Telegram webhook secret validation failed." }).catch(() => undefined);
    return Response.json({ error: "Invalid webhook credentials." }, { status: 401 });
  }

  try {
    const start = parseTelegramStart(parseJson(await readBody(request, 256_000)));
    if (!start) return Response.json({ received: true, linked: false });

    try {
      const profileId = await consumeTelegramLinkToken(createAdminClient(), {
        tokenHash: sha256Hex(start.token),
        chatId: start.chatId,
        userId: start.userId,
        username: start.username,
      });
      await sendTelegramMessage(start.chatId, "Your Telegram account is now linked to As-Sabiqun.", botToken)
        .catch((error) => console.error("Telegram link confirmation failed", error));
      return Response.json({ received: true, linked: Boolean(profileId) });
    } catch (error) {
      await sendTelegramMessage(start.chatId, "This linking request is invalid or has expired. Please create a new link from your As-Sabiqun account.", botToken)
        .catch((sendError) => console.error("Telegram invalid-link message failed", sendError));
      console.warn("Telegram linking request rejected", error);
      return Response.json({ received: true, linked: false });
    }
  } catch (error) {
    console.error("Telegram webhook failed", error);
    await recordIntegrationFailure(createAdminClient(), { provider: "telegram", failureKind: error instanceof ProviderError ? error.code : "processing_failed", detail: error instanceof Error ? error.message : "Unknown Telegram webhook failure." }).catch(() => undefined);
    if (error instanceof ProviderError && ["invalid_json", "body_too_large"].includes(error.code)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
