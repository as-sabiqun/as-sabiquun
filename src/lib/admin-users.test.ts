import assert from "node:assert/strict";
import test from "node:test";
import { adminAccountFields, adminPasswordFields, canAssignAdminAccess, canManageAdminAccess, canRemoveAdminUser } from "./admin-users.ts";

test("admin accounts normalize valid input and reject invalid email", () => {
  const valid = new FormData();
  valid.set("name", "  Operations Admin ");
  valid.set("email", " ADMIN@EXAMPLE.COM ");
  valid.set("accessLevel", "operations");
  valid.set("password", "safe-password-123");
  valid.set("confirmation", "safe-password-123");
  assert.deepEqual(adminAccountFields(valid), { ok: true, name: "Operations Admin", email: "admin@example.com", accessLevel: "operations", password: "safe-password-123" });

  const invalid = new FormData();
  invalid.set("name", "Admin");
  invalid.set("email", "not-an-email");
  assert.deepEqual(adminAccountFields(invalid), { ok: false, error: "Enter a valid administrator email." });
});

test("admin hierarchy only allows assignments below the actor except for owners", () => {
  assert.equal(canAssignAdminAccess("owner", "owner"), true);
  assert.equal(canAssignAdminAccess("administrator", "operations"), true);
  assert.equal(canAssignAdminAccess("administrator", "administrator"), false);
  assert.equal(canManageAdminAccess("administrator", "operations"), true);
  assert.equal(canManageAdminAccess("operations", "operations"), false);
  assert.equal(canRemoveAdminUser("owner", false), true);
  assert.equal(canRemoveAdminUser("owner", true), false);
  assert.equal(canRemoveAdminUser("administrator", false), false);
});

test("admin passwords must be long enough and match", () => {
  const form = new FormData();
  form.set("password", "safe-password-123");
  form.set("confirmation", "different-password");
  assert.deepEqual(adminPasswordFields(form), { ok: false, error: "The passwords do not match." });

  form.set("confirmation", "safe-password-123");
  assert.deepEqual(adminPasswordFields(form), { ok: true, password: "safe-password-123" });
});
