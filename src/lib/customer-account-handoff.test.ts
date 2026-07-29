import assert from "node:assert/strict";
import test from "node:test";
import { shouldResumeCheckout } from "./customer-account-handoff.ts";

test("only an explicit checkout resume request can auto-continue an order", () => {
  assert.equal(shouldResumeCheckout(true, "?resume=checkout"), true);
  assert.equal(shouldResumeCheckout(true, "?resume=dashboard"), false);
  assert.equal(shouldResumeCheckout(false, "?resume=checkout"), false);
});
