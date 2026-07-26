import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_MFA_BYPASS_UNTIL, isAdminMfaBypassActive } from "./auth-policy.ts";
import { safeAdminRedirectPath, safeRedirectPath, safeVendorRedirectPath } from "./auth-redirect.ts";

test("temporary admin MFA bypass expires at the fixed cutoff", () => {
  assert.equal(isAdminMfaBypassActive(ADMIN_MFA_BYPASS_UNTIL - 1), true);
  assert.equal(isAdminMfaBypassActive(ADMIN_MFA_BYPASS_UNTIL), false);
});

test("auth redirects stay on this site", () => {
  assert.equal(safeRedirectPath("/dashboard?tab=orders"), "/dashboard?tab=orders");
  for (const unsafe of ["https://evil.test", "//evil.test", "/\\evil.test", "javascript:alert(1)"]) {
    assert.equal(safeRedirectPath(unsafe, "/login"), "/login");
  }
});

test("role login redirects stay inside the correct portal", () => {
  assert.equal(safeAdminRedirectPath("/admin/jobs/123"), "/admin/jobs/123");
  assert.equal(safeAdminRedirectPath("/admin/mfa/challenge"), "/admin");
  assert.equal(safeAdminRedirectPath("/admin/sign-in/anything"), "/admin");
  assert.equal(safeAdminRedirectPath("/dashboard"), "/admin");
  assert.equal(safeVendorRedirectPath("/vendor-dashboard/jobs/123"), "/vendor-dashboard/jobs/123");
  assert.equal(safeVendorRedirectPath("/admin"), "/vendor-dashboard");
});
