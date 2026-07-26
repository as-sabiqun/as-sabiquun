import assert from "node:assert/strict";
import test from "node:test";
import { draftCategoryFromPath, draftDisplayName, validateEvidenceFile } from "./proof-evidence.ts";

test("completion evidence enforces MIME and size limits", () => {
  assert.equal(validateEvidenceFile({ type: "image/webp", size: 10 * 1024 * 1024 }, "photo"), null);
  assert.match(validateEvidenceFile({ type: "image/gif", size: 1 }, "photo") ?? "", /JPEG/);
  assert.equal(validateEvidenceFile({ type: "video/quicktime", size: 250 * 1024 * 1024 }, "video"), null);
  assert.match(validateEvidenceFile({ type: "video/mp4", size: 250 * 1024 * 1024 + 1 }, "video") ?? "", /250 MB/);
});

test("draft paths restore both current and legacy uploads", () => {
  const current = "vendor/order/drafts/before_photo/123e4567-e89b-12d3-a456-426614174000--site-before.jpg";
  assert.equal(draftCategoryFromPath(current), "before_photo");
  assert.equal(draftDisplayName(current), "site-before.jpg");
  assert.equal(draftCategoryFromPath("vendor/order/drafts/random/during_video.mp4"), "during_video");
  assert.equal(draftCategoryFromPath("vendor/order/final/file.jpg"), null);
});
