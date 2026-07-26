import assert from "node:assert/strict";
import test from "node:test";
import { deriveOrderMilestone, isPaid } from "./order-lifecycle.ts";

const base = {
  payment_status: "paid" as const,
  fulfilment_status: "verified" as const,
  delivery_status: "not_ready" as const,
  settlement_status: "unpaid" as const,
};

test("milestones are derived from independent workflow axes", () => {
  assert.equal(deriveOrderMilestone(base), "verified");
  assert.equal(deriveOrderMilestone({ ...base, delivery_status: "delivered" }), "completed");
  assert.equal(deriveOrderMilestone({ ...base, delivery_status: "delivered", settlement_status: "paid" }), "closed");
  assert.equal(deriveOrderMilestone({ ...base, payment_status: "pending" }), "awaiting_payment");
  assert.equal(deriveOrderMilestone({ ...base, payment_status: "cancelled", fulfilment_status: "not_ready" }), "payment_issue");
  assert.equal(deriveOrderMilestone({ ...base, fulfilment_status: "cancelled" }), "cancelled");
});

test("impact-eligible payment states exclude pending and refunded orders", () => {
  assert.equal(isPaid("paid"), true);
  assert.equal(isPaid("partially_refunded"), true);
  assert.equal(isPaid("pending"), false);
  assert.equal(isPaid("refunded"), false);
});
