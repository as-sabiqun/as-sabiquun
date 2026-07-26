"use client";

import * as tus from "tus-js-client";
import type { SupabaseClient } from "@supabase/supabase-js";

type FileIdentity = Pick<File, "name" | "type" | "size" | "lastModified">;
type StoredTusUpload = {
  size: number | null;
  metadata: Record<string, string>;
  creationTime: string;
  uploadUrl: string | null;
  parallelUploadUrls: string[] | null;
};

export function resumableUploadFingerprint(
  endpoint: string,
  bucketName: string,
  objectName: string,
  file: FileIdentity,
): string {
  return ["as-sabiquun-tus-v1", endpoint, bucketName, objectName, file.name, file.type, file.size, file.lastModified]
    .map((part) => encodeURIComponent(String(part)))
    .join("::");
}

export function matchingStoredUpload<T extends StoredTusUpload>(
  uploads: readonly T[],
  bucketName: string,
  objectName: string,
  file: FileIdentity,
): T | undefined {
  return uploads
    .filter((upload) => upload.size === file.size
      && upload.metadata.bucketName === bucketName
      && upload.metadata.objectName === objectName
      && upload.metadata.contentType === file.type
      && Boolean(upload.uploadUrl || upload.parallelUploadUrls?.length))
    .sort((a, b) => (Date.parse(b.creationTime) || 0) - (Date.parse(a.creationTime) || 0))[0];
}

export async function uploadResumable(
  supabase: SupabaseClient,
  bucketName: string,
  objectName: string,
  file: File,
  onProgress: (percentage: number) => void,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Your session expired. Sign in and try again.");

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) throw new Error("File uploads are not configured.");
  const endpoint = new URL("/storage/v1/upload/resumable", projectUrl);
  endpoint.hostname = endpoint.hostname.replace(".supabase.co", ".storage.supabase.co");
  const endpointUrl = endpoint.toString();
  const fingerprint = resumableUploadFingerprint(endpointUrl, bucketName, objectName, file);

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: endpointUrl,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: { authorization: `Bearer ${session.access_token}`, "x-upsert": "false" },
      uploadDataDuringCreation: true,
      storeFingerprintForResuming: true,
      removeFingerprintOnSuccess: true,
      fingerprint: () => Promise.resolve(fingerprint),
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName,
        objectName,
        contentType: file.type,
        cacheControl: "3600",
      },
      onError: reject,
      onProgress: (uploaded, total) => onProgress(Math.round((uploaded / total) * 100)),
      onSuccess: () => resolve(),
    });

    void upload.findPreviousUploads().then((previous) => {
      const matching = matchingStoredUpload(previous, bucketName, objectName, file);
      if (matching) upload.resumeFromPreviousUpload(matching);
      upload.start();
    }).catch(reject);
  });
}
