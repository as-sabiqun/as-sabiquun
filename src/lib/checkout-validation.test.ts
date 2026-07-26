import assert from "node:assert/strict";
import test from "node:test";
import { dollarsToCents, isContactNumber } from "./checkout-validation.ts";

test("checkout money and phone inputs reject ambiguous values", () => {
  assert.equal(dollarsToCents(25.5), 2550);
  assert.equal(dollarsToCents(25.555), null);
  assert.equal(dollarsToCents(Number.POSITIVE_INFINITY), null);
  assert.equal(isContactNumber("+65 8993 3786"), true);
  assert.equal(isContactNumber("call me"), false);
});
