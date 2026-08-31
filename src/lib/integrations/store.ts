import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AirwallexRefundWebhookEvent, AirwallexWebhookEvent } from "./airwallex";
import { ProviderError, type HitPayWebhookEvent, type JsonObject } from "./providers";

function databaseError(message: string): ProviderError {
  return new ProviderError(message, "database_error", true);
}

function object(value: unknown): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw databaseError("The database returned an invalid result.");
  return value as JsonObject;
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string" || !value) throw databaseError(`The database did not return ${field}.`);
  return value;
}

export interface PreparedPayment {
  transactionId: string;
  orderId: string;
  reference: string;
  amountCents: number;
  currency: "SGD";
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  checkoutUrl: string | null;
  expiresAt: string | null;
  shouldCreate: boolean;
  creating: boolean;
  reconciliationRequired: boolean;
}

export interface PreparedRefund {
  transactionId: string;
  orderId: string;
  reference: string;
  paymentId: string;
  paymentRequestId: string;
  amountCents: number;
  currency: "SGD";
  reason: string;
  refundableAmountCents: number;
  fulfilmentStarted: boolean;
}

export interface PreparedAirwallexPayment {
  transactionId: string;
  orderId: string;
  reference: string;
  requestId: string;
  providerIntentId: string | null;
  amountCents: number;
  currency: "SGD";
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  expiresAt: string;
  reused: boolean;
}

export async function prepareAirwallexPayment(client: SupabaseClient, orderId: string): Promise<PreparedAirwallexPayment> {
  const { data, error } = await client.rpc("prepare_airwallex_payment", { p_order_id: orderId });
  if (error) throw new ProviderError(error.message, "payment_not_payable");
  const row = object(data);
  const amountCents = Number(row.amount);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || row.currency !== "SGD") {
    throw databaseError("The Airwallex payment snapshot is invalid.");
  }
  return {
    transactionId: text(row.transaction_id, "the payment transaction ID"),
    orderId: text(row.order_id, "the order ID"),
    reference: text(row.reference, "the order reference"),
    requestId: text(row.request_id, "the Airwallex request ID"),
    providerIntentId: typeof row.provider_intent_id === "string" ? row.provider_intent_id : null,
    amountCents,
    currency: "SGD",
    customerName: text(row.customer_name, "the customer name"),
    customerEmail: text(row.customer_email, "the customer email"),
    customerPhone: typeof row.customer_phone === "string" ? row.customer_phone : null,
    expiresAt: text(row.expires_at, "the checkout expiry"),
    reused: row.reused === true,
  };
}

export async function recordAirwallexPaymentIntent(client: SupabaseClient, input: {
  transactionId: string;
  requestId: string;
  providerIntentId: string;
  providerStatus: string;
  expiresAt: string;
  payload: JsonObject;
}): Promise<void> {
  const { error } = await client.rpc("record_airwallex_payment_intent", {
    p_transaction_id: input.transactionId,
    p_request_id: input.requestId,
    p_provider_intent_id: input.providerIntentId,
    p_provider_status: input.providerStatus,
    p_expires_at: input.expiresAt,
    p_payload: input.payload,
  });
  if (error) throw databaseError("The Airwallex PaymentIntent could not be recorded.");
}

export async function failAirwallexPaymentCreation(client: SupabaseClient, input: {
  transactionId: string;
  errorMessage: string;
}): Promise<void> {
  const { data, error } = await client.rpc("fail_airwallex_payment_creation", {
    p_transaction_id: input.transactionId,
    p_error_message: input.errorMessage.slice(0, 1_000),
  });
  if (error || data !== true) throw databaseError("The failed Airwallex PaymentIntent could not be recorded.");
}

export async function processAirwallexWebhook(client: SupabaseClient, event: AirwallexWebhookEvent): Promise<void> {
  const { error } = await client.rpc("process_airwallex_payment_event", {
    p_event_id: event.eventId,
    p_event_type: event.eventType,
    p_provider_event_at: event.providerEventAt,
    p_provider_intent_id: event.providerRequestId,
    p_reference: event.reference,
    p_status: event.status,
    p_provider_status: event.providerStatus,
    p_amount: event.amountCents,
    p_currency: event.currency,
    p_payload_hash: event.payloadHash,
    p_payload: event.payload,
  });
  if (error) throw databaseError("The Airwallex payment event could not be applied.");
}

export interface PreparedAirwallexRefund {
  transactionId: string;
  orderId: string;
  reference: string;
  requestId: string;
  paymentIntentId: string;
  amountCents: number;
  currency: "SGD";
  reason: string;
}

export async function prepareAirwallexRefund(client: SupabaseClient, input: {
  orderId: string;
  amountCents: number;
  reason: string;
  confirmFulfilmentStarted: boolean;
}): Promise<PreparedAirwallexRefund> {
  const { data, error } = await client.rpc("prepare_airwallex_refund", {
    p_order_id: input.orderId,
    p_amount: input.amountCents,
    p_reason: input.reason,
    p_confirm_fulfilment_started: input.confirmFulfilmentStarted,
  });
  if (error) throw new ProviderError(error.message, "refund_not_allowed");
  const row = object(data);
  const amountCents = Number(row.amount);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || row.currency !== "SGD") {
    throw databaseError("The Airwallex refund reservation is invalid.");
  }
  return {
    transactionId: text(row.transaction_id, "the refund transaction ID"),
    orderId: text(row.order_id, "the order ID"),
    reference: text(row.reference, "the order reference"),
    requestId: text(row.request_id, "the Airwallex refund request ID"),
    paymentIntentId: text(row.payment_intent_id, "the Airwallex PaymentIntent ID"),
    amountCents,
    currency: "SGD",
    reason: text(row.reason, "the refund reason"),
  };
}

export async function recordAirwallexRefund(client: SupabaseClient, input: {
  transactionId: string;
  requestId: string;
  refundId: string;
  providerStatus: string;
  payload: JsonObject;
}): Promise<void> {
  const { data, error } = await client.rpc("record_airwallex_refund", {
    p_transaction_id: input.transactionId,
    p_request_id: input.requestId,
    p_refund_id: input.refundId,
    p_provider_status: input.providerStatus,
    p_payload: input.payload,
  });
  if (error || data !== true) throw databaseError("The Airwallex refund could not be recorded.");
}

export async function processAirwallexRefundWebhook(client: SupabaseClient, event: AirwallexRefundWebhookEvent): Promise<void> {
  const { error } = await client.rpc("process_airwallex_refund_event", {
    p_event_id: event.eventId,
    p_event_type: event.eventType,
    p_provider_event_at: event.providerEventAt,
    p_refund_id: event.refundId,
    p_request_id: event.requestId,
    p_payment_intent_id: event.paymentIntentId,
    p_status: event.status,
    p_provider_status: event.providerStatus,
    p_amount: event.amountCents,
    p_currency: event.currency,
    p_reason: event.reason,
    p_payload_hash: event.payloadHash,
    p_payload: event.payload,
  });
  if (error) throw databaseError("The Airwallex refund event could not be applied.");
}

export async function prepareHitPayPayment(client: SupabaseClient, orderId: string): Promise<PreparedPayment> {
  const { data, error } = await client.rpc("prepare_hitpay_payment", { p_order_id: orderId });
  if (error) throw new ProviderError(error.message, "payment_not_payable");
  const row = object(data);
  const amountCents = Number(row.amount);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || row.currency !== "SGD") {
    throw databaseError("The payment snapshot is invalid.");
  }
  return {
    transactionId: text(row.transaction_id, "the payment transaction ID"),
    orderId: text(row.order_id, "the order ID"),
    reference: text(row.reference, "the order reference"),
    amountCents,
    currency: "SGD",
    customerName: text(row.customer_name, "the customer name"),
    customerEmail: text(row.customer_email, "the customer email"),
    customerPhone: typeof row.customer_phone === "string" ? row.customer_phone : null,
    checkoutUrl: typeof row.checkout_url === "string" ? row.checkout_url : null,
    expiresAt: typeof row.expires_at === "string" ? row.expires_at : null,
    shouldCreate: row.should_create === true,
    creating: row.creating === true,
    reconciliationRequired: row.reconciliation_required === true,
  };
}

export async function recordHitPayPaymentRequest(client: SupabaseClient, input: {
  transactionId: string;
  providerRequestId: string;
  checkoutUrl: string;
  expiresAt: string | null;
}): Promise<void> {
  const { error } = await client.rpc("record_hitpay_payment_request_result", {
    p_transaction_id: input.transactionId,
    p_provider_request_id: input.providerRequestId,
    p_checkout_url: input.checkoutUrl,
    p_expires_at: input.expiresAt,
  });
  if (error) throw databaseError("The payment request could not be recorded.");
}

export async function markHitPayPaymentReconciliationRequired(client: SupabaseClient, input: {
  transactionId: string;
  providerRequestId?: string | null;
  checkoutUrl?: string | null;
  expiresAt?: string | null;
  errorMessage: string;
  payload?: JsonObject;
}): Promise<void> {
  const { data, error } = await client.rpc("mark_hitpay_payment_reconciliation_required", {
    p_transaction_id: input.transactionId,
    p_provider_request_id: input.providerRequestId ?? null,
    p_checkout_url: input.checkoutUrl ?? null,
    p_expires_at: input.expiresAt ?? null,
    p_error_message: input.errorMessage.slice(0, 1_000),
    p_payload: input.payload ?? {},
  });
  if (error || data !== true) throw databaseError("The uncertain payment request could not be recorded.");
}

export async function failHitPayPaymentCreation(client: SupabaseClient, input: {
  transactionId: string;
  errorMessage: string;
}): Promise<void> {
  const { data, error } = await client.rpc("fail_hitpay_payment_creation", {
    p_transaction_id: input.transactionId,
    p_error_message: input.errorMessage.slice(0, 1_000),
  });
  if (error || data !== true) throw databaseError("The failed payment request could not be recorded.");
}

export async function releaseHitPayPaymentReconciliation(client: SupabaseClient, input: {
  transactionId: string;
  reason: string;
}): Promise<void> {
  const { data, error } = await client.rpc("release_hitpay_payment_reconciliation", {
    p_transaction_id: input.transactionId,
    p_reason: input.reason.slice(0, 1_000),
  });
  if (error || data !== true) throw databaseError("The payment reconciliation could not be released.");
}

export async function prepareHitPayRefund(client: SupabaseClient, input: {
  orderId: string;
  amountCents: number;
  reason: string;
  confirmFulfilmentStarted: boolean;
}): Promise<PreparedRefund> {
  const { data, error } = await client.rpc("prepare_hitpay_refund", {
    p_order_id: input.orderId,
    p_amount: input.amountCents,
    p_reason: input.reason,
    p_confirm_fulfilment_started: input.confirmFulfilmentStarted,
  });
  if (error) throw new ProviderError(error.message, "refund_not_allowed");
  const row = object(data);
  const amountCents = Number(row.amount);
  const refundableAmountCents = Number(row.refundable_amount);
  if (
    !Number.isSafeInteger(amountCents)
    || amountCents <= 0
    || !Number.isSafeInteger(refundableAmountCents)
    || refundableAmountCents < amountCents
    || row.currency !== "SGD"
  ) throw databaseError("The refund reservation is invalid.");
  return {
    transactionId: text(row.transaction_id, "the refund transaction ID"),
    orderId: text(row.order_id, "the order ID"),
    reference: text(row.reference, "the order reference"),
    paymentId: text(row.payment_id, "the captured payment ID"),
    paymentRequestId: text(row.payment_request_id, "the payment request ID"),
    amountCents,
    currency: "SGD",
    reason: text(row.reason, "the refund reason"),
    refundableAmountCents,
    fulfilmentStarted: row.fulfilment_started === true,
  };
}

export async function recordHitPayRefundResult(client: SupabaseClient, input: {
  transactionId: string;
  providerRefundId: string | null;
  accepted: boolean;
  errorMessage?: string | null;
  payload?: JsonObject;
}): Promise<void> {
  const { data, error } = await client.rpc("record_hitpay_refund_result", {
    p_transaction_id: input.transactionId,
    p_provider_refund_id: input.providerRefundId,
    p_accepted: input.accepted,
    p_error_message: input.errorMessage ?? null,
    p_payload: input.payload ?? {},
  });
  if (error || data !== true) throw databaseError("The refund result could not be recorded.");
}

export async function markHitPayRefundReconciliationRequired(client: SupabaseClient, input: {
  transactionId: string;
  providerRefundId?: string | null;
  errorMessage: string;
  payload?: JsonObject;
}): Promise<void> {
  const { data, error } = await client.rpc("mark_hitpay_refund_reconciliation_required", {
    p_transaction_id: input.transactionId,
    p_provider_refund_id: input.providerRefundId ?? null,
    p_error_message: input.errorMessage.slice(0, 1_000),
    p_payload: input.payload ?? {},
  });
  if (error || data !== true) throw databaseError("The uncertain refund could not be recorded.");
}

export async function releaseHitPayRefundReconciliation(client: SupabaseClient, input: {
  transactionId: string;
  confirmedRefundedAmountCents: number;
  reason: string;
}): Promise<void> {
  const { data, error } = await client.rpc("release_hitpay_refund_reconciliation", {
    p_transaction_id: input.transactionId,
    p_confirmed_refunded_amount: input.confirmedRefundedAmountCents,
    p_reason: input.reason.slice(0, 1_000),
  });
  if (error || data !== true) throw databaseError("The refund reconciliation could not be released.");
}

export async function processHitPayWebhook(client: SupabaseClient, event: HitPayWebhookEvent): Promise<void> {
  const { error } = await client.rpc("process_hitpay_webhook", {
    p_payload_hash: event.payloadHash,
    p_event_type: event.eventType,
    p_event_object: event.eventObject,
    p_provider_request_id: event.providerRequestId,
    p_reference: event.reference,
    p_status: event.status,
    p_amount: event.amountCents,
    p_currency: event.currency,
    p_payload: event.payload,
  });
  if (error) throw databaseError("The payment event could not be applied.");
}

export async function consumeTelegramLinkToken(client: SupabaseClient, input: {
  tokenHash: string;
  chatId: number;
  userId: number;
  username: string | null;
}): Promise<string | null> {
  const { data, error } = await client.rpc("consume_telegram_link_token", {
    p_token_hash: input.tokenHash,
    p_chat_id: input.chatId,
    p_telegram_user_id: input.userId,
    p_username: input.username,
  });
  if (error) throw new ProviderError("This Telegram link is invalid or has expired.", "invalid_link");
  return typeof data === "string" ? data : null;
}

export interface DueNotification {
  id: string;
  order_id: string;
  report_id: string;
  channel: "email" | "telegram";
  recipient: string;
  attempt: number;
}

export async function recoverStaleNotifications(client: SupabaseClient, limit: number): Promise<number> {
  const { data, error } = await client.rpc("recover_stale_notification_deliveries", { p_limit: limit });
  if (error || typeof data !== "number") throw databaseError("Stale notification attempts could not be recovered.");
  return data;
}

export async function claimDueNotifications(client: SupabaseClient, limit: number): Promise<DueNotification[]> {
  const { data, error } = await client.rpc("claim_due_notification_deliveries", { p_limit: limit });
  if (error) throw databaseError("Notifications could not be claimed.");
  if (!Array.isArray(data)) throw databaseError("The notification queue returned an invalid result.");
  return data as DueNotification[];
}

export async function recordNotificationAttempt(client: SupabaseClient, input: {
  deliveryId: string;
  status: string;
  providerMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
}): Promise<void> {
  const { error } = await client.rpc("record_notification_attempt", {
    p_delivery_id: input.deliveryId,
    p_status: input.status,
    p_provider_message_id: input.providerMessageId ?? null,
    p_error_code: input.errorCode ?? null,
    p_error_message: input.errorMessage?.slice(0, 1_000) ?? null,
  });
  if (error) throw databaseError("The notification result could not be recorded.");
}

export async function processBrevoWebhook(client: SupabaseClient, event: {
  providerMessageId: string;
  status: string;
  payloadHash: string;
  providerEventAt: string;
  payload: JsonObject;
}): Promise<void> {
  const { error } = await client.rpc("process_brevo_webhook", {
    p_provider_message_id: event.providerMessageId,
    p_status: event.status,
    p_payload_hash: event.payloadHash,
    p_provider_event_at: event.providerEventAt,
    p_payload: event.payload,
  });
  if (error) throw databaseError("The email event could not be applied.");
}

export async function recordIntegrationFailure(client: SupabaseClient, input: {
  provider: "hitpay" | "airwallex" | "brevo" | "telegram" | "internal";
  failureKind: string;
  detail: string;
  payloadHash?: string | null;
}): Promise<void> {
  const { error } = await client.rpc("record_integration_failure", {
    p_provider: input.provider,
    p_failure_kind: input.failureKind,
    p_detail: input.detail.slice(0, 500),
    p_payload_hash: input.payloadHash ?? null,
  });
  if (error) throw databaseError("The integration failure could not be recorded.");
}
