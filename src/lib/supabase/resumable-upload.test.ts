import assert from "node:assert/strict";
import test from "node:test";
import { matchingStoredUpload, resumableUploadFingerprint } from "./resumable-upload.ts";

const file = { name: "completion.mp4", type: "video/mp4", size: 42, lastModified: 123 };

test("TUS identity binds a file to its exact storage path", () => {
  const endpoint = "https://project.storage.supabase.co/storage/v1/upload/resumable";
  const first = resumableUploadFingerprint(endpoint, "proofs", "vendor/order/drafts/before/a.mp4", file);
  const second = resumableUploadFingerprint(endpoint, "proofs", "vendor/order/drafts/after/a.mp4", file);
  assert.notEqual(first, second);
  assert.equal(first, resumableUploadFingerprint(endpoint, "proofs", "vendor/order/drafts/before/a.mp4", file));
});

test("TUS resume selects only the newest matching stored upload", () => {
  const metadata = { bucketName: "proofs", objectName: "vendor/order/draft.mp4", contentType: "video/mp4" };
  const uploads = [
    { size: 42, metadata: { ...metadata, objectName: "vendor/order/other.mp4" }, creationTime: "2026-01-03", uploadUrl: "wrong", parallelUploadUrls: null },
    { size: 42, metadata, creationTime: "2026-01-01", uploadUrl: "older", parallelUploadUrls: null },
    { size: 42, metadata, creationTime: "2026-01-02", uploadUrl: "newer", parallelUploadUrls: null },
  ];
  assert.equal(matchingStoredUpload(uploads, "proofs", metadata.objectName, file)?.uploadUrl, "newer");
  assert.equal(matchingStoredUpload(uploads, "proofs", "vendor/order/missing.mp4", file), undefined);
});
