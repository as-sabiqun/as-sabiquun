import test from "node:test";
import assert from "node:assert/strict";
import { demoOfferings, money, parseOrder, transitionDemoVendorJob } from "./domain.ts";

test("Korban totals and participant count are validated", () => {
  const form = new FormData();
  form.set("full_name", "Demo User"); form.set("email", "demo@example.com"); form.set("phone", "+65 8123 4567");
  form.set("quantity", "2"); form.append("participant_names", "Amina"); form.append("participant_names", "Yusuf");
  const result = parseOrder(form, demoOfferings[0]);
  assert.equal(result.amount, 56000);
  assert.equal(money(result.amount), "$560");
  form.delete("participant_names"); form.append("participant_names", "Amina");
  assert.throws(() => parseOrder(form, demoOfferings[0]), /2 participant names/);
});

test("Wakaf minimums are enforced", () => {
  const form = new FormData();
  form.set("full_name", "Demo User"); form.set("email", "demo@example.com"); form.set("phone", "+65 8123 4567"); form.set("amount", "5");
  assert.throws(() => parseOrder(form, demoOfferings[1]), /minimum contribution/);
});

test("Vendor demo jobs only follow valid transitions", () => {
  assert.equal(transitionDemoVendorJob("pending", "accept"), "active");
  assert.equal(transitionDemoVendorJob("pending", "decline"), "declined");
  assert.equal(transitionDemoVendorJob("active", "submit_proof"), "proof_submitted");
  assert.throws(() => transitionDemoVendorJob("completed", "accept"), /Invalid vendor job transition/);
});
