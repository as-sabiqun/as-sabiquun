"use client";

import { useState, type FormEvent } from "react";
import { useVendorData } from "@/components/vendor/vendor-data-context";

const REQUIRED_PHOTOS = 5;

export function ProofUploadForm({ jobId }: { jobId: string }) {
  const { submitProof } = useVendorData();
  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const photosReady = photos.length >= REQUIRED_PHOTOS;
  const canSubmit = photosReady && Boolean(video);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !video) return;
    submitProof(jobId, { photoCount: photos.length, videoName: video.name, notes, submittedAt: new Date().toISOString() });
  }

  return (
    <form className="vendor-upload-form" onSubmit={submit}>
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
          <input type="file" accept="video/*" className="sr-only" onChange={(event) => setVideo(event.target.files?.[0] ?? null)} />
          <UploadIcon />
          {video ? video.name : "Choose 1 video"}
        </label>
      </div>

      <label className="label">Notes for the operations team <span className="font-normal text-[var(--muted)]">Optional</span>
        <textarea className="input vendor-textarea" rows={3} placeholder="Anything worth flagging about the fulfilment?" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>

      <button type="submit" className="btn" disabled={!canSubmit}>Submit completion <span aria-hidden="true">→</span></button>
      {!canSubmit && <p className="vendor-upload-hint">Add at least {REQUIRED_PHOTOS} photos and 1 video to submit.</p>}
      <p className="text-xs leading-5 text-[var(--muted)]">Working preview — files stay on this device and aren't uploaded anywhere yet.</p>
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
