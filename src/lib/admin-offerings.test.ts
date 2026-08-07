import assert from "node:assert/strict";
import test from "node:test";
import { offeringCategory, offeringFields, offeringSlug, sgdCents } from "./admin-offerings.ts";

test("offering forms parse SGD exactly and keep one pricing axis", () => {
  assert.equal(sgdCents("25.90"), 2590);
  assert.equal(sgdCents("25.999"), null);

  const form = new FormData();
  form.set("title", "  Korban — Camel share  ");
  form.set("detail", "A documented overseas Korban package.");
  form.set("price", "450.50");
  form.set("active", "on");
  assert.deepEqual(offeringFields(form, "korban"), {
    ok: true,
    values: { title: "Korban — Camel share", detail: "A documented overseas Korban package.", unit_amount: 45050, min_amount: null, active: true },
  });
  assert.equal(offeringSlug("korban", "Korban — Camel share"), "korban-camel-share");
  assert.equal(offeringSlug("water", "Wakaf — Village pump"), "water-village-pump");
  assert.equal(offeringCategory("quran")?.pricing, "wakaf");
  assert.equal(offeringCategory("unknown"), null);
});
