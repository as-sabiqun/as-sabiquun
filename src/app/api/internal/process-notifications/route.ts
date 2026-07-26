import {
  bearerMatches,
  notificationFailureStatus,
  ProviderError,
  sendBrevoReport,
  sendTelegramDocument,
} from "@/lib/integrations/providers";
import { claimDueNotifications, recordIntegrationFailure, recordNotificationAttempt, recoverStaleNotifications, type DueNotification } from "@/lib/integrations/store";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ReportContext {
  storagePath: string;
  orderReference: string;
  customerName: string;
}

async function reportContext(admin: ReturnType<typeof createAdminClient>, reportId: string): Promise<ReportContext> {
  const { data, error } = await admin
    .from("completion_reports")
    .select("storage_path, orders!inner(reference, customer_name)")
    .eq("id", reportId)
    .single();
  if (error || !data) throw new ProviderError("Completion report not found.", "report_not_found");
  const order = Array.isArray(data.orders) ? data.orders[0] : data.orders;
  if (typeof data.storage_path !== "string" || !order || typeof order.reference !== "string" || typeof order.customer_name !== "string") {
    throw new ProviderError("Completion report order not found.", "report_not_found");
  }
  return { storagePath: data.storage_path, orderReference: order.reference, customerName: order.customer_name };
}

async function deliver(admin: ReturnType<typeof createAdminClient>, notification: DueNotification): Promise<string> {
  const report = await reportContext(admin, notification.report_id);
  const { data, error } = await admin.storage.from("completion-reports").createSignedUrl(report.storagePath, 15 * 60);
  if (error || !data?.signedUrl) throw new ProviderError("Completion report is unavailable.", "report_unavailable");

  if (notification.channel === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notification.recipient)) {
      throw new ProviderError("The customer email address is invalid.", "invalid_recipient");
    }
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME;
    if (!apiKey || !senderEmail || !senderName) throw new ProviderError("Email delivery is not configured.", "configuration_error");
    return sendBrevoReport({
      recipientEmail: notification.recipient,
      recipientName: report.customerName,
      orderReference: report.orderReference,
      documentUrl: data.signedUrl,
      apiKey,
      senderEmail,
      senderName,
      idempotencyKey: notification.report_id,
    });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new ProviderError("Telegram delivery is not configured.", "configuration_error");
  if (!/^-?\d{1,20}$/.test(notification.recipient)) {
    throw new ProviderError("The Telegram chat ID is invalid.", "invalid_recipient");
  }
  return sendTelegramDocument({
    chatId: notification.recipient,
    documentUrl: data.signedUrl,
    caption: `Your verified As-Sabiqun completion report for ${report.orderReference}.`,
    token,
  });
}

export async function POST(request: Request) {
  const secret = process.env.INTERNAL_CRON_SECRET;
  if (!secret) return Response.json({ error: "Notification processing is not configured." }, { status: 503 });
  if (!bearerMatches(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Invalid credentials." }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data: expiredBroadcasts, error: expiryError } = await admin.rpc("expire_stale_broadcasts");
    if (expiryError) throw new ProviderError("Stale offers could not be expired.", "database_error", true);

    const recovered = await recoverStaleNotifications(admin, 50);
    const notifications = await claimDueNotifications(admin, 10);
    const results = await Promise.all(notifications.map(async (notification) => {
      const { data: current, error: currentError } = await admin.from("notification_deliveries").select("status").eq("id", notification.id).maybeSingle();
      if (currentError) throw new ProviderError("Notification state could not be confirmed.", "database_error", true);
      if (current?.status !== "sending") return false;
      let providerMessageId: string;
      try {
        providerMessageId = await deliver(admin, notification);
      } catch (error) {
        await recordNotificationAttempt(admin, {
          deliveryId: notification.id,
          status: notificationFailureStatus(error),
          errorCode: error instanceof ProviderError ? error.code : "provider_unavailable",
          errorMessage: error instanceof Error ? error.message : "Unknown provider error",
        });
        return false;
      }
      await recordNotificationAttempt(admin, {
        deliveryId: notification.id,
        status: "sent",
        providerMessageId,
      });
      return true;
    }));
    const sent = results.filter(Boolean).length;

    return Response.json({
      expiredBroadcasts: typeof expiredBroadcasts === "number" ? expiredBroadcasts : 0,
      recovered,
      claimed: notifications.length,
      sent,
      failed: notifications.length - sent,
    });
  } catch (error) {
    console.error("Scheduled operations failed", error);
    await recordIntegrationFailure(createAdminClient(), { provider: "internal", failureKind: "scheduled_operations", detail: error instanceof Error ? error.message : "Unknown scheduled operations failure." }).catch(() => undefined);
    return Response.json({ error: "Scheduled operations failed." }, { status: 500 });
  }
}
