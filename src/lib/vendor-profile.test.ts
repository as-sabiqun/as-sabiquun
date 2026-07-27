import assert from "node:assert/strict";
import test from "node:test";
import { hasCompleteVendorProfile } from "./vendor-profile.ts";

const complete = {
  display_name: "Amanah Partners",
  contact_person: "Ahmad",
  phone: "+65 8123 4567",
  country: "Indonesia",
  city_address: "Jakarta",
  vendor_type: "General / multi-service vendor",
  services: ["korban"],
  bank_name: "Example Bank",
  bank_account_name: "Amanah Partners",
  bank_account_number: "123456789",
};

test("admin-created vendor profile is ready only when every operational field exists", () => {
  assert.equal(hasCompleteVendorProfile(complete), true);
  assert.equal(hasCompleteVendorProfile({ ...complete, services: [] }), false);
  assert.equal(hasCompleteVendorProfile({ ...complete, bank_account_number: "" }), false);
});
