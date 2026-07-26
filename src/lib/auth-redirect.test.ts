import assert from "node:assert/strict";
import test from "node:test";
import { safeRedirectPath } from "./auth-redirect.ts";

test("auth redirects stay on this site", () => {
  assert.equal(safeRedirectPath("/dashboard?tab=orders"), "/dashboard?tab=orders");
  for (const unsafe of ["https://evil.test", "//evil.test", "/\\evil.test", "javascript:alert(1)"]) {
    assert.equal(safeRedirectPath(unsafe, "/login"), "/login");
  }
});
