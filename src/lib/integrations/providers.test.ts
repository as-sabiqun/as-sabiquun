import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  bearerMatches,
  centsToDecimal,
  createHitPayPaymentRequest,
  createHitPayRefund,
  findHitPayPaymentRequestsByReference,
  getHitPayCharge,
  decimalToCents,
  mapBrevoEvent,
  nextRetryAt,
  parseBrevoWebhook,
  parseHitPayWebhook,
  parseTelegramStart,
  sendBrevoReport,
  verifyHitPaySignature,
} from "./providers.ts";

test("HitPay signatures use the untouched raw body", () => {
  const raw = '{"id":"request-1","amount":"10.00"}';
  const signature = createHmac("sha256", "salt").update(raw).digest("hex");
  assert.equal(verifyHitPaySignature(raw, signature, "salt"), true);
  assert.equal(verifyHitPaySignature(`${raw}\n`, signature, "salt"), false);
  assert.equal(verifyHitPaySignature(raw, "not-a-signature", "salt"), false);
});

test("money conversions preserve cents exactly", () => {
  assert.equal(decimalToCents("100"), 10_000);
  assert.equal(decimalToCents("19.9"), 1_990);
  assert.equal(decimalToCents(19.99), 1_999);
  assert.equal(centsToDecimal(1_999), "19.99");
  assert.throws(() => decimalToCents("1.999"));
  assert.throws(() => centsToDecimal(0));
});

test("HitPay checkout is server-created in sandbox without a deprecated webhook URL", async () => {
  let url = "";
  let requestBody: Record<string, unknown> = {};
  const result = await createHitPayPaymentRequest({
    orderId: "00000000-0000-4000-8000-000000000001",
    reference: "ASQ-2607-TEST",
    amountCents: 4_990,
    currency: "SGD",
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    redirectUrl: "https://www.as-sabiqun.com/dashboard/orders/ASQ-2607-TEST?payment=processing",
  }, {
    apiKey: "sandbox-key",
    fetcher: async (input, init) => {
      url = String(input);
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return Response.json({ id: "request-1", url: "https://securecheckout.sandbox.hit-pay.com/1", status: "pending" });
    },
  });
  assert.equal(url, "https://api.sandbox.hit-pay.com/v1/payment-requests");
  assert.equal(requestBody.amount, "49.90");
  assert.equal("webhook" in requestBody, false);
  assert.equal(result.id, "request-1");
});

test("HitPay payment-request reconciliation searches by exact order reference", async () => {
  const rows = await findHitPayPaymentRequestsByReference("ASQ-2607-TEST", {
    apiKey: "sandbox-key",
    fetcher: async (input, init) => {
      const url = new URL(String(input));
      assert.equal(url.pathname, "/v1/payment-requests");
      assert.equal(url.searchParams.get("search"), "ASQ-2607-TEST");
      assert.equal((init?.headers as Record<string, string>)["X-BUSINESS-API-KEY"], "sandbox-key");
      return Response.json({ data: [
        {
          id: "request-1",
          url: "https://securecheckout.sandbox.hit-pay.com/1",
          status: "pending",
          amount: "49.90",
          currency: "sgd",
          reference_number: "ASQ-2607-TEST",
          expiry_date: "2026-07-26T23:00:00Z",
          metadata: { order_id: "00000000-0000-4000-8000-000000000001" },
        },
        {
          id: "partial-search-result",
          reference_number: "ASQ-2607-TEST-OTHER",
        },
      ] });
    },
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, "request-1");
  assert.equal(rows[0].amountCents, 4_990);
  assert.equal(rows[0].metadataOrderId, "00000000-0000-4000-8000-000000000001");
});

test("HitPay refund sends the exact reserved amount without a per-request webhook", async () => {
  let url = "";
  let requestBody: Record<string, unknown> = {};
  const result = await createHitPayRefund({ paymentId: "payment-1", amountCents: 1_999 }, {
    apiKey: "sandbox-key",
    fetcher: async (input, init) => {
      url = String(input);
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return Response.json({ id: "refund-1", status: "pending" });
    },
  });
  assert.equal(url, "https://api.sandbox.hit-pay.com/v1/refund");
  assert.deepEqual(requestBody, { payment_id: "payment-1", amount: "19.99" });
  assert.equal(result.id, "refund-1");
});

test("HitPay charge lookup returns authoritative cumulative refund cents", async () => {
  const charge = await getHitPayCharge("charge-1", {
    apiKey: "sandbox-key",
    fetcher: async (input, init) => {
      assert.equal(String(input), "https://api.sandbox.hit-pay.com/v1/charges/charge-1");
      assert.equal((init?.headers as Record<string, string>)["X-BUSINESS-API-KEY"], "sandbox-key");
      return Response.json({
        id: "charge-1",
        payment_request_id: "request-1",
        order_reference_number: "ASQ-2607-TEST",
        currency: "sgd",
        refunded_amount: 19.99,
      });
    },
  });
  assert.equal(charge.refundedAmountCents, 1_999);
  assert.equal(charge.currency, "SGD");
  assert.equal(charge.paymentRequestId, "request-1");
});

test("HitPay webhook parsing normalizes only known terminal states", () => {
  const raw = JSON.stringify({
    id: "provider-request-id",
    reference_number: "ASQ-2607-TEST",
    status: "completed",
    amount: "49.90",
    currency: "sgd",
  });
  const event = parseHitPayWebhook(raw, "completed", "payment_request");
  assert.equal(event.status, "succeeded");
  assert.equal(event.amountCents, 4_990);
  assert.equal(event.currency, "SGD");
  assert.throws(() => parseHitPayWebhook(raw.replace("completed", "pending"), "updated", "payment_request"));
});

test("HitPay charge updates use the payment request and cumulative refund amount", () => {
  const event = parseHitPayWebhook(JSON.stringify({
    id: "charge-id",
    payment_request_id: "provider-request-id",
    status: "partially_refunded",
    amount: 100,
    refunded_amount: 20,
    currency: "sgd",
  }), "updated", "charge");
  assert.equal(event.eventType, "refund.updated");
  assert.equal(event.providerRequestId, "provider-request-id");
  assert.equal(event.reference, "");
  assert.equal(event.amountCents, 2_000);
});

test("Brevo maps delivery outcomes and ignores engagement events", () => {
  assert.equal(mapBrevoEvent("delivered"), "delivered");
  assert.equal(mapBrevoEvent("soft_bounce"), "deferred");
  assert.equal(mapBrevoEvent("hardBounce"), "bounced");
  assert.equal(mapBrevoEvent("opened"), null);

  const events = parseBrevoWebhook(JSON.stringify([
    { event: "sent", "message-id": "m-1", ts_event: 1_700_000_000 },
    { event: "opened", "message-id": "m-1", ts_event: 1_700_000_001 },
  ]));
  assert.equal(events.length, 1);
  assert.equal(events[0].status, "sent");
});

test("Brevo report retries use the report ID as an idempotency key", async () => {
  let body: Record<string, unknown> = {};
  await sendBrevoReport({
    recipientEmail: "customer@example.test",
    recipientName: "Customer",
    orderReference: "ASQ-TEST",
    documentUrl: "https://example.test/report.pdf",
    apiKey: "secret",
    senderEmail: "reports@example.test",
    senderName: "As-Sabiqun",
    idempotencyKey: "13000000-0000-4000-8000-000000000099",
    fetcher: async (_url, init) => {
      body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({ messageId: "brevo-message" }), { status: 201 });
    },
  });
  assert.deepEqual(body.headers, { "Idempotency-Key": "13000000-0000-4000-8000-000000000099" });
});

test("Telegram linking accepts only a private /start token", () => {
  const token = "a".repeat(43);
  assert.deepEqual(parseTelegramStart({
    message: {
      text: `/start ${token}`,
      chat: { id: 123, type: "private" },
      from: { id: 456, username: "customer" },
    },
  }), { token, chatId: 123, userId: 456, username: "customer" });
  assert.equal(parseTelegramStart({
    message: { text: `/start ${token}`, chat: { id: -1, type: "group" }, from: { id: 456 } },
  }), null);
});

test("cron secrets and retry schedule are bounded", () => {
  assert.equal(bearerMatches("Bearer secret", "secret"), true);
  assert.equal(bearerMatches("secret", "secret"), false);
  const now = new Date("2026-07-26T00:00:00.000Z");
  assert.equal(nextRetryAt(1, now), "2026-07-26T00:15:00.000Z");
  assert.equal(nextRetryAt(2, now), "2026-07-26T02:00:00.000Z");
  assert.equal(nextRetryAt(3, now), null);
});
