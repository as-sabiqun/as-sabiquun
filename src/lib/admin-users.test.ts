import assert from "node:assert/strict";
import test from "node:test";
import { adminInviteFields } from "./admin-users.ts";

test("admin invitations normalize valid input and reject invalid email", () => {
  const valid = new FormData();
  valid.set("name", "  Operations Admin ");
  valid.set("email", " ADMIN@EXAMPLE.COM ");
  assert.deepEqual(adminInviteFields(valid), { ok: true, name: "Operations Admin", email: "admin@example.com" });

  const invalid = new FormData();
  invalid.set("name", "Admin");
  invalid.set("email", "not-an-email");
  assert.deepEqual(adminInviteFields(invalid), { ok: false, error: "Enter a valid administrator email." });
});
