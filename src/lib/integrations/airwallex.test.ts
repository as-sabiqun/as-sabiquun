import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  clearAirwallexTokenCacheForTests,
  createAirwallexPaymentIntent,
  createAirwallexRefund,
  parseAirwallexRefundWebhook,
  parseAirwallexWebhook,
  retrieveAirwallexPaymentIntent,
  verifyAirwallexWebhookSignature,
} from "./airwallex.ts";

test("Airwallex creates an idempotent SGD PaymentIntent after server authentication", async () => {
  clearAirwallexTokenCacheForTests();
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith("/authentication/login")) {
      return Response.json({ token: "access-token" });
    }
    return Response.json({
      id: "int_test123",
      client_secret: "secret_test123",
      request_id: "46fbea85-21ba-4c8f-b526-65f26f70deef",
      merchant_order_id: "ASQ-2608-TEST",
      amount: 129.9,
      currency: "SGD",
      status: "REQUIRES_PAYMENT_METHOD",
      created_at: "2026-08-31T00:00:00+0000",
    });
  };

  const intent = await createAirwallexPaymentIntent({
    orderId: "03ddc23c-8721-4180-a61c-2f37759194d8",
    reference: "ASQ-2608-TEST",
    requestId: "46fbea85-21ba-4c8f-b526-65f26f70deef",
    amountCents: 12_990,
    currency: "SGD",
    returnUrl: "https://www.as-sabiqun.com/dashboard/orders/ASQ-2608-TEST",
  }, { clientId: "client", apiKey: "key", environment: "sandbox", fetcher });

  assert.equal(intent.amountCents, 12_990);
  assert.equal(intent.clientSecret, "secret_test123");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://api-demo.airwallex.com/api/v1/authentication/login");
  assert.equal(new Headers(calls[0].init?.headers).get("x-api-key"), "key");
  const body = JSON.parse(String(calls[1].init?.body)) as Record<string, unknown>;
  assert.deepEqual(body, {
    request_id: "46fbea85-21ba-4c8f-b526-65f26f70deef",
    amount: 129.9,
    currency: "SGD",
    merchant_order_id: "ASQ-2608-TEST",
    return_url: "https://www.as-sabiqun.com/dashboard/orders/ASQ-2608-TEST",
    metadata: { order_id: "03ddc23c-8721-4180-a61c-2f37759194d8" },
  });
});

test("Airwallex refunds use a stable request UUID and exact reserved amount", async () => {
  clearAirwallexTokenCacheForTests();
  let refundBody: Record<string, unknown> | null = null;
  const fetcher: typeof fetch = async (input, init) => {
    if (String(input).endsWith("/authentication/login")) return Response.json({ token: "access-token" });
    refundBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json({
      id: "rfd_test123",
      request_id: "f5b8f4fc-aa70-4b98-a605-2d65253773e2",
      payment_intent_id: "int_test123",
      amount: 19.99,
      currency: "SGD",
      reason: "Customer request",
      status: "RECEIVED",
    }, { status: 201 });
  };
  const refund = await createAirwallexRefund({
    paymentIntentId: "int_test123",
    requestId: "f5b8f4fc-aa70-4b98-a605-2d65253773e2",
    amountCents: 1_999,
    reason: "Customer request",
  }, { clientId: "client", apiKey: "key", fetcher });
  assert.equal(refund.amountCents, 1_999);
  assert.deepEqual(refundBody, {
    request_id: "f5b8f4fc-aa70-4b98-a605-2d65253773e2",
    payment_intent_id: "int_test123",
    amount: 19.99,
    reason: "Customer request",
  });
});

test("Airwallex retrieves the exact intent without leaking credentials into the URL", async () => {
  clearAirwallexTokenCacheForTests();
  const urls: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.endsWith("/authentication/login")) return Response.json({ token: "access-token" });
    return Response.json({
      id: "int_test123",
      request_id: "46fbea85-21ba-4c8f-b526-65f26f70deef",
      merchant_order_id: "ASQ-2608-TEST",
      amount: 50,
      currency: "SGD",
      status: "SUCCEEDED",
    });
  };
  const intent = await retrieveAirwallexPaymentIntent("int_test123", { clientId: "client", apiKey: "key", environment: "production", fetcher });
  assert.equal(intent.status, "SUCCEEDED");
  assert.equal(urls[1], "https://api.airwallex.com/api/v1/pa/payment_intents/int_test123");
  assert.equal(urls[1].includes("key"), false);
});

test("Airwallex verifies the raw timestamp-prefixed webhook and rejects stale delivery", () => {
  const raw = '{"id":"evt_1"}';
  const timestamp = "1788134400000";
  const signature = createHmac("sha256", "secret").update(`${timestamp}${raw}`).digest("hex");
  assert.equal(verifyAirwallexWebhookSignature({ raw, timestamp, signature, secret: "secret", now: 1_788_134_400_000 }), true);
  assert.equal(verifyAirwallexWebhookSignature({ raw: `${raw}\n`, timestamp, signature, secret: "secret", now: 1_788_134_400_000 }), false);
  assert.equal(verifyAirwallexWebhookSignature({ raw, timestamp, signature, secret: "secret", now: 1_788_135_000_001 }), false);
});

test("Airwallex webhook parser keeps pending states non-fulfillable", () => {
  const base = {
    id: "evt_1",
    account_id: "acct_1",
    created_at: "2026-08-31T00:00:00+0000",
    data: { object: {
      id: "int_test123",
      merchant_order_id: "ASQ-2608-TEST",
      amount: 88.5,
      currency: "SGD",
      status: "PENDING_REVIEW",
    } },
  };
  const pending = parseAirwallexWebhook(JSON.stringify({ ...base, name: "payment_intent.pending_review" }));
  assert.equal(pending.status, "pending");
  assert.equal(pending.providerStatus, "PENDING_REVIEW");

  const succeeded = parseAirwallexWebhook(JSON.stringify({
    ...base,
    id: "evt_2",
    name: "payment_intent.succeeded",
    data: { object: { ...base.data.object, status: "SUCCEEDED" } },
  }));
  assert.equal(succeeded.status, "succeeded");
  assert.equal(succeeded.amountCents, 8_850);
});

test("Airwallex refund webhook confirms only accepted or settled refunds", () => {
  const event = parseAirwallexRefundWebhook(JSON.stringify({
    id: "evt_refund_1",
    name: "refund.accepted",
    created_at: "2026-08-31T00:00:00+0000",
    data: { object: {
      id: "rfd_test123",
      request_id: "f5b8f4fc-aa70-4b98-a605-2d65253773e2",
      payment_intent_id: "int_test123",
      amount: 25,
      currency: "SGD",
      reason: "Customer request",
      status: "ACCEPTED",
    } },
  }));
  assert.equal(event.status, "succeeded");
  assert.equal(event.amountCents, 2_500);
});
