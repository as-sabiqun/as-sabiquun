import assert from "node:assert/strict";
import test from "node:test";
import { customerAccountLabel, customerDirectoryState, customerDirectorySummary, customerOrderMetrics } from "./customer-directory.ts";

test("customer directory separates readiness and counts production activity", () => {
  assert.equal(customerDirectoryState({ verified: true, telegramLinked: true, status: "active" }), "ready");
  assert.equal(customerDirectoryState({ verified: true, telegramLinked: false, status: "active" }), "needs_setup");
  assert.equal(customerDirectoryState({ verified: true, telegramLinked: true, status: "suspended" }), "suspended");
  assert.equal(customerAccountLabel({ verified: true, telegramLinked: false, status: "active" }), "Telegram needed");
  assert.equal(customerAccountLabel({ verified: true, telegramLinked: true, status: "active" }), "Ready to pay");
  assert.equal(customerAccountLabel({ verified: true, telegramLinked: true, status: "suspended" }), "Access suspended");

  const metrics = customerOrderMetrics([
    { total_amount: 28_000, payment_provider: "hitpay", payment_status: "paid", fulfilment_status: "in_progress", delivery_status: "not_ready" },
    { total_amount: 12_000, payment_provider: "hitpay", payment_status: "partially_refunded", fulfilment_status: "verified", delivery_status: "delivered", payment_transactions: [{ transaction_type: "refund", amount: 2_000, status: "succeeded" }] },
    { total_amount: 50_000, payment_provider: "demo", payment_status: "paid", fulfilment_status: "verified", delivery_status: "delivered" },
    { total_amount: 8_000, payment_provider: "hitpay", payment_status: "pending", fulfilment_status: "not_ready", delivery_status: "not_ready" },
  ]);

  assert.deepEqual(metrics, { paidOrdersCount: 2, activeProjects: 1, completedProjects: 1, lifetimeSpendCents: 38_000 });
  assert.deepEqual(customerDirectorySummary([{ verified: true, telegramLinked: true, status: "active", ...metrics }]), {
    verified: 1, telegramLinked: 1, ready: 1, paidOrders: 2, activeProjects: 1, completedProjects: 1, lifetimeSpendCents: 38_000,
  });
});
