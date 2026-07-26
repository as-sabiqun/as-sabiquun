import assert from "node:assert/strict";
import test from "node:test";
import { boardKeyForStatus, buildJourneySeries } from "./customer-dashboard.ts";

test("customer dashboard groups jobs and builds a cumulative journey", () => {
  const points = buildJourneySeries(
    [
      { created_at: "2026-01-10T00:00:00Z", admin_verified_at: "2026-02-12T00:00:00Z", status: "completed" },
      { created_at: "2026-03-10T00:00:00Z", status: "in_progress" },
      { created_at: "2026-03-11T00:00:00Z", status: "cancelled" },
    ],
    new Date("2026-03-20T00:00:00Z"),
    3
  );

  assert.deepEqual(points.map((point) => [point.started, point.verified]), [[1, 0], [1, 1], [2, 1]]);
  assert.equal(boardKeyForStatus("proof_submitted"), "review");
  assert.equal(boardKeyForStatus("closed"), "completed");
  assert.equal(boardKeyForStatus("cancelled"), null);
});
