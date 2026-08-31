import { createHmac, timingSafeEqual } from "node:crypto";
import { centsToDecimal, parseJson, ProviderError, sha256Hex, type JsonObject } from "./providers.ts";

export type AirwallexEnvironment = "sandbox" | "production";
export type AirwallexIntentStatus =
  | "REQUIRES_PAYMENT_METHOD"
  | "REQUIRES_CUSTOMER_ACTION"
  | "REQUIRES_CAPTURE"
  | "PENDING"
  | "PENDING_REVIEW"
  | "SUCCEEDED"
  | "CANCELLED";

export interface AirwallexConfig {
  clientId: string;
  apiKey: string;
  environment?: string;
  fetcher?: typeof fetch;
}

export interface AirwallexPaymentIntent {
  id: string;
  clientSecret: string | null;
  requestId: string;
  merchantOrderId: string;
  amountCents: number;
  currency: string;
  status: AirwallexIntentStatus;
  createdAt: string | null;
  updatedAt: string | null;
  payload: JsonObject;
}

export type AirwallexNormalizedStatus = "pending" | "succeeded" | "cancelled";

export interface AirwallexWebhookEvent {
  eventId: string;
  eventType: string;
  accountId: string | null;
  providerEventAt: string;
  providerRequestId: string;
  reference: string;
  status: AirwallexNormalizedStatus;
  providerStatus: AirwallexIntentStatus;
  amountCents: number;
  currency: string;
  payloadHash: string;
  payload: JsonObject;
}

export type AirwallexRefundStatus = "RECEIVED" | "ACCEPTED" | "SETTLED" | "SUCCEEDED" | "FAILED";

export interface AirwallexRefund {
  id: string;
  requestId: string;
  paymentIntentId: string;
  amountCents: number;
  currency: string;
  reason: string;
  status: AirwallexRefundStatus;
  payload: JsonObject;
}

export interface AirwallexRefundWebhookEvent {
  kind: "refund";
  eventId: string;
  eventType: string;
  accountId: string | null;
  providerEventAt: string;
  refundId: string;
  requestId: string;
  paymentIntentId: string;
  amountCents: number;
  currency: string;
  reason: string;
  status: "pending" | "succeeded" | "failed";
  providerStatus: AirwallexRefundStatus;
  payloadHash: string;
  payload: JsonObject;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

const tokenCache = new Map<string, CachedToken>();

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string, maxLength = 500): string {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new ProviderError(`Invalid ${field}.`, "invalid_payload");
  }
  return value.trim();
}

function apiBase(environment: string | undefined): string {
  return environment === "production"
    ? "https://api.airwallex.com/api/v1"
    : "https://api-demo.airwallex.com/api/v1";
}

function environmentName(environment: string | undefined): AirwallexEnvironment {
  return environment === "production" ? "production" : "sandbox";
}

async function responseJson(response: Response): Promise<JsonObject> {
  const raw = await response.text();
  const parsed = raw ? parseJson(raw) : {};
  if (!isObject(parsed)) throw new ProviderError("Airwallex returned an invalid response.", "invalid_response", true);
  if (!response.ok) {
    const message = typeof parsed.message === "string"
      ? parsed.message
      : typeof parsed.code === "string"
        ? `Airwallex request failed: ${parsed.code}.`
        : `Airwallex request failed (${response.status}).`;
    throw new ProviderError(message, `airwallex_http_${response.status}`, response.status === 429 || response.status >= 500);
  }
  return parsed;
}

function moneyToCents(value: unknown): number {
  if (typeof value !== "number" && typeof value !== "string") {
    throw new ProviderError("Invalid Airwallex amount.", "invalid_amount");
  }
  const numeric = Number(value);
  const cents = Math.round(numeric * 100);
  if (!Number.isFinite(numeric) || numeric <= 0 || !Number.isSafeInteger(cents) || Math.abs(numeric * 100 - cents) > 0.000_001) {
    throw new ProviderError("Invalid Airwallex amount.", "invalid_amount");
  }
  return cents;
}

function intentStatus(value: unknown): AirwallexIntentStatus {
  const normalized = requiredString(value, "Airwallex PaymentIntent status", 100).toUpperCase();
  if ([
    "REQUIRES_PAYMENT_METHOD",
    "REQUIRES_CUSTOMER_ACTION",
    "REQUIRES_CAPTURE",
    "PENDING",
    "PENDING_REVIEW",
    "SUCCEEDED",
    "CANCELLED",
  ].includes(normalized)) return normalized as AirwallexIntentStatus;
  throw new ProviderError("Unsupported Airwallex PaymentIntent status.", "unsupported_event");
}

function normalizeStatus(status: AirwallexIntentStatus): AirwallexNormalizedStatus {
  if (status === "SUCCEEDED") return "succeeded";
  if (status === "CANCELLED") return "cancelled";
  // A failed PaymentAttempt usually returns its PaymentIntent to
  // REQUIRES_PAYMENT_METHOD so the same intent can be retried safely.
  return "pending";
}

function parseIntent(payload: JsonObject, requireClientSecret: boolean): AirwallexPaymentIntent {
  const clientSecret = typeof payload.client_secret === "string" && payload.client_secret
    ? payload.client_secret
    : null;
  if (requireClientSecret && !clientSecret) {
    throw new ProviderError("Airwallex did not return a PaymentIntent client secret.", "invalid_response", true);
  }
  const safePayload = { ...payload };
  delete safePayload.client_secret;
  return {
    id: requiredString(payload.id, "Airwallex PaymentIntent ID", 200),
    clientSecret,
    requestId: requiredString(payload.request_id, "Airwallex request ID", 100),
    merchantOrderId: requiredString(payload.merchant_order_id, "Airwallex merchant order ID", 200),
    amountCents: moneyToCents(payload.amount),
    currency: requiredString(payload.currency, "Airwallex currency", 10).toUpperCase(),
    status: intentStatus(payload.status),
    createdAt: typeof payload.created_at === "string" ? payload.created_at : null,
    updatedAt: typeof payload.updated_at === "string" ? payload.updated_at : null,
    payload: safePayload,
  };
}

async function accessToken(config: AirwallexConfig): Promise<string> {
  const cacheKey = `${environmentName(config.environment)}:${config.clientId}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const response = await (config.fetcher ?? fetch)(`${apiBase(config.environment)}/authentication/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": config.clientId,
      "x-api-key": config.apiKey,
    },
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await responseJson(response);
  const token = requiredString(payload.token, "Airwallex access token", 10_000);
  // Airwallex access tokens currently last about 30 minutes. Refresh early.
  tokenCache.set(cacheKey, { token, expiresAt: Date.now() + 25 * 60_000 });
  return token;
}

export async function createAirwallexPaymentIntent(input: {
  orderId: string;
  reference: string;
  requestId: string;
  amountCents: number;
  currency: "SGD";
  returnUrl: string;
}, config: AirwallexConfig): Promise<AirwallexPaymentIntent> {
  const token = await accessToken(config);
  const response = await (config.fetcher ?? fetch)(`${apiBase(config.environment)}/pa/payment_intents/create`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      request_id: input.requestId,
      amount: Number(centsToDecimal(input.amountCents)),
      currency: input.currency,
      merchant_order_id: input.reference,
      return_url: input.returnUrl,
      metadata: { order_id: input.orderId },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  return parseIntent(await responseJson(response), true);
}

export async function retrieveAirwallexPaymentIntent(intentId: string, config: AirwallexConfig): Promise<AirwallexPaymentIntent> {
  if (!/^int_[A-Za-z0-9_-]{1,200}$/.test(intentId)) {
    throw new ProviderError("Invalid Airwallex PaymentIntent ID.", "invalid_intent_id");
  }
  const token = await accessToken(config);
  const response = await (config.fetcher ?? fetch)(
    `${apiBase(config.environment)}/pa/payment_intents/${encodeURIComponent(intentId)}`,
    { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) },
  );
  return parseIntent(await responseJson(response), false);
}

function refundStatus(value: unknown): AirwallexRefundStatus {
  const normalized = requiredString(value, "Airwallex refund status", 100).toUpperCase();
  if (["RECEIVED", "ACCEPTED", "SETTLED", "SUCCEEDED", "FAILED"].includes(normalized)) {
    return normalized as AirwallexRefundStatus;
  }
  throw new ProviderError("Unsupported Airwallex refund status.", "unsupported_event");
}

function parseRefund(payload: JsonObject): AirwallexRefund {
  return {
    id: requiredString(payload.id, "Airwallex refund ID", 200),
    requestId: requiredString(payload.request_id, "Airwallex refund request ID", 100),
    paymentIntentId: requiredString(payload.payment_intent_id, "Airwallex PaymentIntent ID", 200),
    amountCents: moneyToCents(payload.amount),
    currency: requiredString(payload.currency, "Airwallex refund currency", 10).toUpperCase(),
    reason: typeof payload.reason === "string" ? payload.reason.slice(0, 128) : "Customer refund",
    status: refundStatus(payload.status),
    payload,
  };
}

export async function createAirwallexRefund(input: {
  paymentIntentId: string;
  requestId: string;
  amountCents: number;
  reason: string;
}, config: AirwallexConfig): Promise<AirwallexRefund> {
  if (!/^int_[A-Za-z0-9_-]{1,200}$/.test(input.paymentIntentId)) {
    throw new ProviderError("Invalid Airwallex PaymentIntent ID.", "invalid_intent_id");
  }
  const token = await accessToken(config);
  const response = await (config.fetcher ?? fetch)(`${apiBase(config.environment)}/pa/refunds/create`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      request_id: input.requestId,
      payment_intent_id: input.paymentIntentId,
      amount: Number(centsToDecimal(input.amountCents)),
      reason: input.reason.trim().slice(0, 128),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  return parseRefund(await responseJson(response));
}

export function verifyAirwallexWebhookSignature(input: {
  raw: string;
  timestamp: string | null;
  signature: string | null;
  secret: string;
  now?: number;
  toleranceMs?: number;
}): boolean {
  const { raw, timestamp, signature, secret } = input;
  if (!timestamp || !/^\d{10,16}$/.test(timestamp) || !signature || !/^[a-f0-9]{64}$/i.test(signature) || !secret) return false;
  const timestampMs = Number(timestamp);
  const toleranceMs = input.toleranceMs ?? 5 * 60_000;
  if (!Number.isSafeInteger(timestampMs) || Math.abs((input.now ?? Date.now()) - timestampMs) > toleranceMs) return false;
  const computed = createHmac("sha256", secret).update(`${timestamp}${raw}`, "utf8").digest();
  const received = Buffer.from(signature, "hex");
  return received.length === computed.length && timingSafeEqual(received, computed);
}

export function parseAirwallexWebhook(raw: string): AirwallexWebhookEvent {
  const payload = parseJson(raw);
  if (!isObject(payload) || !isObject(payload.data) || !isObject(payload.data.object)) {
    throw new ProviderError("Invalid Airwallex webhook payload.", "invalid_payload");
  }
  const eventType = requiredString(payload.name, "Airwallex event name", 200).toLowerCase();
  if (!eventType.startsWith("payment_intent.")) {
    throw new ProviderError("Unsupported Airwallex event.", "unsupported_event");
  }
  const object = payload.data.object;
  const providerStatus = intentStatus(object.status);
  return {
    eventId: requiredString(payload.id, "Airwallex event ID", 255),
    eventType,
    accountId: typeof payload.account_id === "string"
      ? payload.account_id
      : typeof payload.accountId === "string"
        ? payload.accountId
        : null,
    providerEventAt: requiredString(payload.created_at, "Airwallex event timestamp", 100),
    providerRequestId: requiredString(object.id, "Airwallex PaymentIntent ID", 200),
    reference: requiredString(object.merchant_order_id, "Airwallex merchant order ID", 200),
    status: normalizeStatus(providerStatus),
    providerStatus,
    amountCents: moneyToCents(object.amount),
    currency: requiredString(object.currency, "Airwallex currency", 10).toUpperCase(),
    payloadHash: sha256Hex(raw),
    payload,
  };
}

export function parseAirwallexRefundWebhook(raw: string): AirwallexRefundWebhookEvent {
  const payload = parseJson(raw);
  if (!isObject(payload) || !isObject(payload.data) || !isObject(payload.data.object)) {
    throw new ProviderError("Invalid Airwallex webhook payload.", "invalid_payload");
  }
  const eventType = requiredString(payload.name, "Airwallex event name", 200).toLowerCase();
  if (!eventType.startsWith("refund.")) throw new ProviderError("Unsupported Airwallex event.", "unsupported_event");
  const refund = parseRefund(payload.data.object);
  const status = refund.status === "FAILED"
    ? "failed"
    : ["ACCEPTED", "SETTLED", "SUCCEEDED"].includes(refund.status)
      ? "succeeded"
      : "pending";
  return {
    kind: "refund",
    eventId: requiredString(payload.id, "Airwallex event ID", 255),
    eventType,
    accountId: typeof payload.account_id === "string" ? payload.account_id : typeof payload.accountId === "string" ? payload.accountId : null,
    providerEventAt: requiredString(payload.created_at, "Airwallex event timestamp", 100),
    refundId: refund.id,
    requestId: refund.requestId,
    paymentIntentId: refund.paymentIntentId,
    amountCents: refund.amountCents,
    currency: refund.currency,
    reason: refund.reason,
    status,
    providerStatus: refund.status,
    payloadHash: sha256Hex(raw),
    payload,
  };
}

export function airwallexClientEnvironment(environment: string | undefined): "sandbox" | "prod" {
  return environment === "production" ? "prod" : "sandbox";
}

export function clearAirwallexTokenCacheForTests(): void {
  tokenCache.clear();
}
