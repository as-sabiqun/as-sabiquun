import assert from "node:assert/strict";
import test from "node:test";
import { queueForOrder, type QueueableOrder } from "./operations.ts";

const base: QueueableOrder = {
  payment_status: "paid",
  fulfilment_status: "ready",
  delivery_status: "not_ready",
  settlement_status: "unpaid",
  broadcast_started_at: null,
  broadcast_expires_at: null,
};

test("admin queue derives one highest-priority operational action", () => {
  assert.equal(queueForOrder(base), "ready");
  assert.equal(queueForOrder({ ...base, payment_status: "failed" }), "payment_issue");
  assert.equal(queueForOrder({ ...base, payment_status: "refunded", fulfilment_status: "in_progress" }), "payment_issue");
  assert.equal(queueForOrder({ ...base, payment_status: "refunded", fulfilment_status: "verified", refund_fulfilment_resolution: "retained_verified" }), "settlement");
  assert.equal(queueForOrder({ ...base, fulfilment_status: "proof_submitted" }), "review");
  assert.equal(queueForOrder({ ...base, fulfilment_status: "verified", delivery_status: "failed" }), "delivery_failed");
  assert.equal(queueForOrder({ ...base, fulfilment_status: "verified", delivery_status: "delivered" }), "settlement");
  assert.equal(queueForOrder({ ...base, broadcast_started_at: "2026-01-01T00:00:00Z" }), "unclaimed");
  assert.equal(queueForOrder({ ...base, fulfilment_status: "verified", delivery_status: "delivered", settlement_status: "paid" }), null);
});
