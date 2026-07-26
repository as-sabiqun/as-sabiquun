import assert from "node:assert/strict";
import test from "node:test";
import { boardKeyForFulfilment, buildJourneySeries, customerStepIndex, isImpactOrder } from "./customer-dashboard.ts";

test("customer dashboard groups jobs and builds a cumulative journey", () => {
  const points = buildJourneySeries(
    [
      { created_at: "2025-12-10T00:00:00Z", payment_confirmed_at: "2026-01-10T00:00:00Z", admin_verified_at: "2026-02-12T00:00:00Z", payment_status: "paid", fulfilment_status: "verified" },
      { created_at: "2026-03-10T00:00:00Z", payment_status: "partially_refunded", fulfilment_status: "in_progress" },
      { created_at: "2026-03-11T00:00:00Z", payment_status: "paid", fulfilment_status: "cancelled" },
    ],
    new Date("2026-03-20T00:00:00Z"),
    3
  );

  assert.deepEqual(points.map((point) => [point.started, point.verified]), [[1, 0], [1, 1], [2, 1]]);
  assert.equal(boardKeyForFulfilment("broadcasting"), "waiting");
  assert.equal(boardKeyForFulfilment("verified"), "review");
  assert.equal(customerStepIndex("verified", "delivered"), 3);
});

test("impact excludes unpaid, refunded, and test orders", () => {
  const series = buildJourneySeries([
    { created_at: "2026-01-02T00:00:00Z", admin_verified_at: null, payment_status: "pending", fulfilment_status: "not_ready" },
    { created_at: "2026-01-03T00:00:00Z", admin_verified_at: "2026-01-05T00:00:00Z", payment_status: "paid", fulfilment_status: "verified" },
    { created_at: "2026-01-04T00:00:00Z", admin_verified_at: "2026-01-06T00:00:00Z", payment_status: "refunded", fulfilment_status: "verified" },
    { created_at: "2026-01-07T00:00:00Z", admin_verified_at: "2026-01-08T00:00:00Z", payment_status: "paid", fulfilment_status: "verified", is_test: true },
  ], new Date("2026-01-31T00:00:00Z"), 1);

  assert.deepEqual(series, [{ label: "Jan", started: 1, verified: 1 }]);
  assert.equal(isImpactOrder({ payment_status: "paid", fulfilment_status: "verified", is_test: true }), false);
});
