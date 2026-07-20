import test from "node:test";
import assert from "node:assert/strict";
import { transitionDemoAdminOrder } from "./admin-demo.ts";

test("admin demo orders only follow valid operational transitions", () => {
  assert.equal(transitionDemoAdminOrder("unassigned", "assign"), "assigned");
  assert.equal(transitionDemoAdminOrder("in_progress", "reassign"), "assigned");
  assert.equal(transitionDemoAdminOrder("proof_submitted", "approve_proof"), "completed");
  assert.equal(transitionDemoAdminOrder("proof_submitted", "request_changes"), "in_progress");
  assert.throws(() => transitionDemoAdminOrder("completed", "approve_proof"), /Invalid admin order transition/);
});
