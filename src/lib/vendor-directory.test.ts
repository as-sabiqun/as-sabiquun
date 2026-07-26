import assert from "node:assert/strict";
import test from "node:test";
import { vendorDirectoryState } from "./vendor-directory.ts";

test("vendor directory groups every onboarding state", () => {
  assert.equal(vendorDirectoryState({ status: "active", vendor_onboarding_status: "approved" }), "operational");
  assert.equal(vendorDirectoryState({ status: "active", vendor_onboarding_status: "pending" }), "pending");
  assert.equal(vendorDirectoryState({ status: "active", vendor_onboarding_status: "invited" }), "invited");
  assert.equal(vendorDirectoryState({ status: "suspended", vendor_onboarding_status: "approved" }), "paused");
  assert.equal(vendorDirectoryState({ status: "active", vendor_onboarding_status: "rejected" }), "paused");
});
