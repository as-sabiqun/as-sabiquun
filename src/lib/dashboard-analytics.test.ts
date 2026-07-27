import assert from "node:assert/strict";
import test from "node:test";
import { buildMonthlyMetricSeries } from "./dashboard-analytics.ts";

test("dashboard analytics buckets counts and signed values by UTC month", () => {
  const points = buildMonthlyMetricSeries(
    ["paid", "refund"],
    [
      { metric: "paid", occurredAt: "2026-01-04T00:00:00Z" },
      { metric: "paid", occurredAt: "2026-02-04T00:00:00Z", value: 2_000 },
      { metric: "refund", occurredAt: "2026-02-05T00:00:00Z", value: 500 },
      { metric: "ignored", occurredAt: "2026-02-05T00:00:00Z", value: 999 },
      { metric: "paid", occurredAt: null, value: 999 },
    ],
    new Date("2026-03-20T00:00:00Z"),
    3,
  );

  assert.deepEqual(points, [
    { label: "Jan", values: { paid: 1, refund: 0 } },
    { label: "Feb", values: { paid: 2_000, refund: 500 } },
    { label: "Mar", values: { paid: 0, refund: 0 } },
  ]);
});
