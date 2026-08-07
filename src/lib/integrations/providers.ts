import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type JsonObject = Record<string, unknown>;

export class ProviderError extends Error {
  readonly code: string;
  readonly retryable: boolean;

  constructor(
    message: string,
    code: string,
    retryable = false,
  ) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.retryable = retryable;
  }
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string, maxLength = 500): string {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new ProviderError(`Invalid ${field}.`, "invalid_payload");
  }
  return value.trim();
}

function hitPayCheckoutUrl(value: unknown): string {
  const raw = requiredString(value, "checkout URL", 2_000);
  try {
    const url = new URL(raw);
    if (
      url.protocol !== "https:"
      || url.username
      || url.password
      || (url.port && url.port !== "443")
      || !["securecheckout.hit-pay.com", "securecheckout.sandbox.hit-pay.com"].includes(url.hostname)
    ) {
      throw new Error("Unexpected checkout origin");
    }
    return url.toString();
  } catch {
    throw new ProviderError("HitPay returned an invalid checkout URL.", "invalid_response", true);
  }
}

export function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new ProviderError("The request body is not valid JSON.", "invalid_json");
  }
}

export async function readBody(request: Request, maxBytes: number): Promise<string> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new ProviderError("The request body is too large.", "body_too_large");
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    throw new ProviderError("The request body is too large.", "body_too_large");
  }
  return raw;
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function secretsMatch(received: string | null, expected: string): boolean {
  if (!received || !expected) return false;
  const receivedHash = createHash("sha256").update(received).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(receivedHash, expectedHash);
}

export function bearerMatches(header: string | null, secret: string): boolean {
  if (!header?.startsWith("Bearer ")) return false;
  return secretsMatch(header.slice(7), secret);
}

export function verifyHitPaySignature(raw: string, signature: string | null, salt: string): boolean {
  const normalized = signature?.replace(/^sha256=/i, "") ?? "";
  if (!/^[a-f0-9]{64}$/i.test(normalized)) return false;
  const computed = createHmac("sha256", salt).update(raw, "utf8").digest("hex");
  return secretsMatch(normalized.toLowerCase(), computed);
}

export function decimalToCents(value: unknown): number {
  const text = typeof value === "number" && Number.isFinite(value) ? String(value) : value;
  if (typeof text !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new ProviderError("Invalid monetary amount.", "invalid_amount");
  }
  const [whole, fraction = ""] = text.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new ProviderError("Invalid monetary amount.", "invalid_amount");
  }
  return cents;
}

export function centsToDecimal(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents <= 0) {
    throw new ProviderError("Invalid monetary amount.", "invalid_amount");
  }
  return (cents / 100).toFixed(2);
}

export interface HitPayPaymentInput {
  orderId: string;
  reference: string;
  amountCents: number;
  currency: "SGD";
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  redirectUrl: string;
}

export interface HitPayPaymentRequest {
  id: string;
  url: string;
  status: string;
  expiresAt: string | null;
}

export interface HitPayPaymentRequestLookup extends HitPayPaymentRequest {
  reference: string;
  amountCents: number;
  currency: string;
  metadataOrderId: string | null;
  payload: JsonObject;
}

export interface HitPayRefund {
  id: string;
  status: string;
  payload: JsonObject;
}

export interface HitPayCharge {
  id: string;
  paymentRequestId: string | null;
  orderReference: string | null;
  currency: string;
  refundedAmountCents: number;
  payload: JsonObject;
}

function hitPayBaseUrl(environment: string | undefined): string {
  return environment === "production" ? "https://api.hit-pay.com" : "https://api.sandbox.hit-pay.com";
}

async function providerJson(response: Response): Promise<JsonObject> {
  const raw = await response.text();
  const parsed = raw ? parseJson(raw) : {};
  if (!isObject(parsed)) throw new ProviderError("The provider returned an invalid response.", "invalid_response", true);
  if (!response.ok) {
    const message = typeof parsed.message === "string" ? parsed.message : `Provider request failed (${response.status}).`;
    throw new ProviderError(message, `http_${response.status}`, response.status === 429 || response.status >= 500);
  }
  return parsed;
}

export async function createHitPayPaymentRequest(
  input: HitPayPaymentInput,
  config: { apiKey: string; environment?: string; fetcher?: typeof fetch },
): Promise<HitPayPaymentRequest> {
  const fetcher = config.fetcher ?? fetch;
  const response = await fetcher(`${hitPayBaseUrl(config.environment)}/v1/payment-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-BUSINESS-API-KEY": config.apiKey,
    },
    body: JSON.stringify({
      amount: centsToDecimal(input.amountCents),
      currency: input.currency,
      payment_methods: ["paynow_online", "card"],
      email: input.customerEmail,
      name: input.customerName,
      ...(input.customerPhone ? { phone: input.customerPhone } : {}),
      purpose: `As-Sabiqun order ${input.reference}`,
      reference_number: input.reference,
      redirect_url: input.redirectUrl,
      allow_repeated_payments: false,
      expires_after: "30 minutes",
      send_email: false,
      send_sms: false,
      metadata: { order_id: input.orderId },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await providerJson(response);
  return {
    id: requiredString(payload.id, "payment request ID", 100),
    url: hitPayCheckoutUrl(payload.url),
    status: requiredString(payload.status, "payment status", 50).toLowerCase(),
    expiresAt: typeof payload.expiry_date === "string" ? payload.expiry_date : null,
  };
}

/**
 * HitPay's current payment-request contract does not expose an idempotency key.
 * Its list endpoint does support searching by reference_number, which lets an
 * administrator reconcile a timed-out create call without issuing another one.
 */
export async function findHitPayPaymentRequestsByReference(
  reference: string,
  config: { apiKey: string; environment?: string; fetcher?: typeof fetch },
): Promise<HitPayPaymentRequestLookup[]> {
  const normalizedReference = requiredString(reference, "order reference", 255);
  const url = new URL(`${hitPayBaseUrl(config.environment)}/v1/payment-requests`);
  url.searchParams.set("search", normalizedReference);
  url.searchParams.set("per_page", "100");
  url.searchParams.set("current_page", "1");
  const response = await (config.fetcher ?? fetch)(url, {
    headers: { "X-BUSINESS-API-KEY": config.apiKey },
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await providerJson(response);
  const rows = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.payment_requests)
      ? payload.payment_requests
      : [];

  return rows.flatMap((value): HitPayPaymentRequestLookup[] => {
    if (!isObject(value) || value.reference_number !== normalizedReference) return [];
    const metadata = isObject(value.metadata) ? value.metadata : null;
    return [{
      id: requiredString(value.id, "payment request ID", 100),
      url: hitPayCheckoutUrl(value.url),
      status: requiredString(value.status, "payment request status", 50).toLowerCase(),
      expiresAt: typeof value.expiry_date === "string" ? value.expiry_date : null,
      reference: normalizedReference,
      amountCents: decimalToCents(value.amount),
      currency: requiredString(value.currency, "payment request currency", 10).toUpperCase(),
      metadataOrderId: typeof metadata?.order_id === "string" ? metadata.order_id : null,
      payload: value,
    }];
  });
}

export async function createHitPayRefund(
  input: { paymentId: string; amountCents: number },
  config: { apiKey: string; environment?: string; fetcher?: typeof fetch },
): Promise<HitPayRefund> {
  const response = await (config.fetcher ?? fetch)(`${hitPayBaseUrl(config.environment)}/v1/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-BUSINESS-API-KEY": config.apiKey,
    },
    body: JSON.stringify({ payment_id: input.paymentId, amount: centsToDecimal(input.amountCents) }),
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await providerJson(response);
  return {
    id: requiredString(payload.id, "refund ID", 100),
    status: typeof payload.status === "string" ? payload.status.toLowerCase() : "accepted",
    payload,
  };
}

export async function getHitPayCharge(
  chargeId: string,
  config: { apiKey: string; environment?: string; fetcher?: typeof fetch },
): Promise<HitPayCharge> {
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(chargeId)) throw new ProviderError("Invalid HitPay charge ID.", "invalid_charge_id");
  const response = await (config.fetcher ?? fetch)(`${hitPayBaseUrl(config.environment)}/v1/charges/${encodeURIComponent(chargeId)}`, {
    headers: { "X-BUSINESS-API-KEY": config.apiKey },
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await providerJson(response);
  const currency = requiredString(payload.currency, "charge currency", 10).toUpperCase();
  const refundedAmountCents = decimalToCents(payload.refunded_amount ?? 0);
  return {
    id: requiredString(payload.id, "charge ID", 200),
    paymentRequestId: typeof payload.payment_request_id === "string" ? payload.payment_request_id : null,
    orderReference: typeof payload.order_reference_number === "string" ? payload.order_reference_number : null,
    currency,
    refundedAmountCents,
    payload,
  };
}

export type HitPayTransactionStatus = "succeeded" | "failed" | "expired" | "cancelled";

export interface HitPayWebhookEvent {
  eventType: string;
  eventObject: string;
  providerRequestId: string;
  reference: string;
  status: HitPayTransactionStatus;
  amountCents: number;
  currency: string;
  payload: JsonObject;
  payloadHash: string;
}

export function parseHitPayWebhook(raw: string, eventTypeHeader: string | null, eventObjectHeader: string | null): HitPayWebhookEvent {
  const payload = parseJson(raw);
  if (!isObject(payload)) throw new ProviderError("Invalid HitPay payload.", "invalid_payload");

  let eventType = requiredString(eventTypeHeader, "HitPay event type", 100).toLowerCase();
  const eventObject = requiredString(eventObjectHeader, "HitPay event object", 100).toLowerCase();
  const rawStatus = String(payload.status ?? eventType).toLowerCase();
  const isRefund = eventObject === "charge" && ["partially_refunded", "refunded"].includes(rawStatus);
  if (eventObject !== "payment_request" && !isRefund) {
    throw new ProviderError("Unsupported HitPay event.", "unsupported_event");
  }
  const paymentRequest = isObject(payload.payment_request) ? payload.payment_request : null;
  const providerRequestId = requiredString(
    isRefund ? payload.payment_request_id ?? paymentRequest?.id : payload.id,
    "HitPay request ID",
    100,
  );
  const referenceValue = payload.reference_number ?? payload.reference ?? paymentRequest?.reference_number;
  const reference = typeof referenceValue === "string" ? referenceValue.trim().slice(0, 100) : "";
  const currency = requiredString(payload.currency, "currency", 10).toUpperCase();
  const amountCents = decimalToCents(isRefund ? payload.refunded_amount : payload.amount);
  if (amountCents <= 0) throw new ProviderError("Invalid monetary amount.", "invalid_amount");

  let status: HitPayTransactionStatus;
  if (["completed", "succeeded", "success", "refunded", "partially_refunded"].includes(rawStatus)) status = "succeeded";
  else if (["expired"].includes(rawStatus) || eventType.includes("expired")) status = "expired";
  else if (["cancelled", "canceled"].includes(rawStatus) || eventType.includes("cancel")) status = "cancelled";
  else if (["failed", "failure"].includes(rawStatus) || eventType.includes("failed")) status = "failed";
  else throw new ProviderError("Unsupported HitPay payment status.", "unsupported_event");
  if (isRefund) eventType = `refund.${eventType}`;

  return { eventType, eventObject, providerRequestId, reference, status, amountCents, currency, payload, payloadHash: sha256Hex(raw) };
}

export type DeliveryAttemptStatus = "sent" | "delivered" | "deferred" | "bounced" | "blocked" | "failed";

export interface BrevoWebhookEvent {
  providerMessageId: string;
  status: DeliveryAttemptStatus;
  providerEventAt: string;
  payload: JsonObject;
  payloadHash: string;
}

export function mapBrevoEvent(event: unknown): DeliveryAttemptStatus | null {
  if (typeof event !== "string") return null;
  const normalized = event.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase().replace(/[- ]/g, "_");
  if (["request", "sent"].includes(normalized)) return "sent";
  if (normalized === "delivered") return "delivered";
  if (["deferred", "soft_bounce"].includes(normalized)) return "deferred";
  if (["hard_bounce", "bounce"].includes(normalized)) return "bounced";
  if (["blocked", "spam", "unsubscribed"].includes(normalized)) return "blocked";
  if (["invalid", "error"].includes(normalized)) return "failed";
  return null;
}

export function parseBrevoWebhook(raw: string): BrevoWebhookEvent[] {
  const parsed = parseJson(raw);
  const payloads = Array.isArray(parsed) ? parsed : [parsed];
  if (payloads.length > 100) throw new ProviderError("Too many webhook events.", "body_too_large");

  return payloads.flatMap((value) => {
    if (!isObject(value)) throw new ProviderError("Invalid Brevo payload.", "invalid_payload");
    const status = mapBrevoEvent(value.event ?? value.msg_status);
    if (!status) return [];
    const providerMessageId = requiredString(value["message-id"] ?? value.messageId, "Brevo message ID", 500);
    const seconds = Number(value.ts_event ?? value.ts);
    const providerEventAt = Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1_000).toISOString() : new Date().toISOString();
    return [{ providerMessageId, status, providerEventAt, payload: value, payloadHash: sha256Hex(JSON.stringify(value)) }];
  });
}

export interface TelegramStart {
  token: string;
  chatId: number;
  userId: number;
  username: string | null;
}

export function parseTelegramStart(payload: unknown): TelegramStart | null {
  if (!isObject(payload) || !isObject(payload.message)) return null;
  const message = payload.message;
  if (!isObject(message.chat)) return null;
  const chat = message.chat;
  if (chat.type !== "private" || typeof message.text !== "string" || !isObject(message.from)) return null;
  const match = message.text.trim().match(/^\/start(?:@[A-Za-z0-9_]+)?\s+([A-Za-z0-9_-]{32,128})$/);
  if (!match || !Number.isSafeInteger(chat.id) || !Number.isSafeInteger(message.from.id)) return null;
  return {
    token: match[1],
    chatId: chat.id as number,
    userId: message.from.id as number,
    username: typeof message.from.username === "string" ? message.from.username.slice(0, 100) : null,
  };
}

async function telegramCall(
  method: string,
  body: JsonObject,
  config: { token: string; fetcher?: typeof fetch },
): Promise<JsonObject> {
  const response = await (config.fetcher ?? fetch)(`https://api.telegram.org/bot${config.token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await providerJson(response);
  if (payload.ok !== true || !isObject(payload.result)) {
    const description = typeof payload.description === "string" ? payload.description : "Telegram rejected the request.";
    throw new ProviderError(description, `telegram_${response.status}`, response.status === 429 || response.status >= 500);
  }
  return payload.result;
}

export async function sendTelegramMessage(chatId: string | number, text: string, token: string): Promise<string> {
  const result = await telegramCall("sendMessage", { chat_id: chatId, text }, { token });
  return String(result.message_id);
}

export async function sendTelegramDocument(input: {
  chatId: string;
  documentUrl: string;
  caption: string;
  token: string;
}): Promise<string> {
  const result = await telegramCall("sendDocument", {
    chat_id: input.chatId,
    document: input.documentUrl,
    caption: input.caption,
  }, { token: input.token });
  return String(result.message_id);
}

export async function sendBrevoReport(input: {
  recipientEmail: string;
  recipientName: string;
  orderReference: string;
  documentUrl: string;
  apiKey: string;
  senderEmail: string;
  senderName: string;
  idempotencyKey: string;
  fetcher?: typeof fetch;
}): Promise<string> {
  const response = await (input.fetcher ?? fetch)("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "api-key": input.apiKey },
    body: JSON.stringify({
      sender: { email: input.senderEmail, name: input.senderName },
      to: [{ email: input.recipientEmail, name: input.recipientName }],
      subject: `Your As-Sabiqun completion report — ${input.orderReference}`,
      htmlContent: `<p>Assalamu alaikum ${escapeHtml(input.recipientName)},</p><p>Your project has been verified. Your completion report is attached.</p><p>JazakAllahu khairan for your trust.</p>`,
      attachment: [{ url: input.documentUrl, name: `${input.orderReference}-completion-report.pdf` }],
      headers: { "Idempotency-Key": input.idempotencyKey },
      tags: ["completion-report"],
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await providerJson(response);
  return requiredString(payload.messageId, "Brevo message ID", 500);
}

export async function sendResendAdminAccess(input: {
  recipientEmail: string;
  recipientName: string;
  password: string;
  accessLabel: string;
  loginUrl: string;
  apiKey: string;
  idempotencyKey: string;
  fetcher?: typeof fetch;
}): Promise<string> {
  const greeting = escapeHtml(input.recipientName);
  const email = escapeHtml(input.recipientEmail);
  const password = escapeHtml(input.password);
  const accessLabel = escapeHtml(input.accessLabel);
  const loginUrl = escapeHtml(input.loginUrl);
  const response = await (input.fetcher ?? fetch)("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
      "User-Agent": "As-Sabiqun/1.0",
    },
    body: JSON.stringify({
      from: "As-Sabiqun <no-reply@as-sabiqun.com>",
      to: [input.recipientEmail],
      subject: "Your As-Sabiqun admin login",
      text: `Assalamu alaikum ${input.recipientName},\n\nYour As-Sabiqun ${input.accessLabel} account is ready.\n\nSign in: ${input.loginUrl}\nEmail: ${input.recipientEmail}\nPassword: ${input.password}\n\nKeep this email private. Contact an owner if you need a new password.`,
      html: `<p>Assalamu alaikum ${greeting},</p><p>Your As-Sabiqun <strong>${accessLabel}</strong> account is ready.</p><p><a href="${loginUrl}">Sign in to the admin console</a></p><p><strong>Email:</strong> ${email}<br><strong>Password:</strong> ${password}</p><p>Keep this email private. Contact an owner if you need a new password.</p>`,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await providerJson(response);
  return requiredString(payload.id, "Resend message ID", 500);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

export const NOTIFICATION_RETRY_DELAYS_MS = [15 * 60_000, 2 * 60 * 60_000] as const;

export function nextRetryAt(failedAttempt: number, now = new Date()): string | null {
  const delay = NOTIFICATION_RETRY_DELAYS_MS[failedAttempt - 1];
  return delay === undefined ? null : new Date(now.getTime() + delay).toISOString();
}

export function notificationFailureStatus(error: unknown): DeliveryAttemptStatus {
  if (!(error instanceof ProviderError)) return "deferred";
  if (error.retryable) return "deferred";
  if (error.code === "http_403" || error.code === "telegram_403") return "blocked";
  return "failed";
}
