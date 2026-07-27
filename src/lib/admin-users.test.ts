import assert from "node:assert/strict";
import test from "node:test";
import { adminInviteFields, canAssignAdminAccess, canManageAdminAccess } from "./admin-users.ts";

test("admin invitations normalize valid input and reject invalid email", () => {
  const valid = new FormData();
  valid.set("name", "  Operations Admin ");
  valid.set("email", " ADMIN@EXAMPLE.COM ");
  valid.set("accessLevel", "operations");
  assert.deepEqual(adminInviteFields(valid), { ok: true, name: "Operations Admin", email: "admin@example.com", accessLevel: "operations" });

  const invalid = new FormData();
  invalid.set("name", "Admin");
  invalid.set("email", "not-an-email");
  assert.deepEqual(adminInviteFields(invalid), { ok: false, error: "Enter a valid administrator email." });
});

test("admin hierarchy only allows assignments below the actor except for owners", () => {
  assert.equal(canAssignAdminAccess("owner", "owner"), true);
  assert.equal(canAssignAdminAccess("administrator", "operations"), true);
  assert.equal(canAssignAdminAccess("administrator", "administrator"), false);
  assert.equal(canManageAdminAccess("administrator", "operations"), true);
  assert.equal(canManageAdminAccess("operations", "operations"), false);
});
