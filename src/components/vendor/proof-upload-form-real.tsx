"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { submitProofAction } from "@/app/vendor-dashboard/actions";

const REQUIRED_PHOTOS = 5;

export function ProofUploadFormReal({ orderId, vendorId }: { orderId: string; vendorId: string }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const photosReady = photos.length >= REQUIRED_PHOTOS;
  const canSubmit = photosReady && Boolean(video) && !uploading;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photosReady || !video) return;
    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const paths: string[] = [];
      const files = [...photos, video];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`Uploading ${i + 1} of ${files.length}…`);
        const path = `${vendorId}/${orderId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("proofs").upload(path, file);
        if (uploadError) throw new Error(uploadError.message);
        paths.push(path);
      }

      setProgress("Recording completion…");
      const res = await submitProofAction(orderId, paths, notes);
      if (!res.ok) throw new Error(res.error ?? "Couldn't submit completion.");

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress("");
    }
  }

  return (
    <form className="vendor-upload-form" onSubmit={submit}>
      {error && <p className="auth-error">{error}</p>}

      <div>
        <div className="vendor-upload-label-row">
          <span className="label">Completion photos</span>
          <span className={`vendor-upload-count ${photosReady ? "is-complete" : ""}`}>{photos.length} of {REQUIRED_PHOTOS} minimum</span>
        </div>
        <label className="vendor-upload-dropzone">
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={(event) => setPhotos(Array.from(event.target.files ?? []))}
          />
          <UploadIcon />
          {photos.length === 0 ? "Choose at least 5 photos" : `${photos.length} photo${photos.length === 1 ? "" : "s"} selected`}
        </label>
        {photos.length > 0 && (
          <ul className="vendor-upload-filelist">
            {photos.map((file, i) => <li key={`${file.name}-${i}`}>{file.name}</li>)}
          </ul>
        )}
      </div>

      <div>
        <div className="vendor-upload-label-row">
          <span className="label">Completion video</span>
          <span className={`vendor-upload-count ${video ? "is-complete" : ""}`}>{video ? "1 of 1" : "0 of 1"}</span>
        </div>
        <label className="vendor-upload-dropzone">
          <input type="file" accept="video/*" className="sr-only" disabled={uploading} onChange={(event) => setVideo(event.target.files?.[0] ?? null)} />
          <UploadIcon />
          {video ? video.name : "Choose 1 video"}
        </label>
      </div>

      <label className="label">Notes for the operations team <span className="font-normal text-[var(--muted)]">Optional</span>
        <textarea className="input vendor-textarea" rows={3} placeholder="Anything worth flagging about the fulfilment?" value={notes} onChange={(event) => setNotes(event.target.value)} disabled={uploading} />
      </label>

      <button type="submit" className="btn" disabled={!canSubmit}>{uploading ? progress || "Submitting…" : "Submit completion"} <span aria-hidden="true">→</span></button>
      {!photosReady || !video ? <p className="vendor-upload-hint">Add at least {REQUIRED_PHOTOS} photos and 1 video to submit.</p> : null}
    </form>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V4M12 4 7 9M12 4l5 5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
