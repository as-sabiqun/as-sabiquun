"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { submitProofAction } from "@/app/vendor-dashboard/actions";

const PHOTO_CATEGORIES = [
  { key: "before_photo", label: "Before — photos", min: 3 },
  { key: "during_photo", label: "During — photos", min: 3 },
  { key: "after_photo", label: "After — photos", min: 3 },
] as const;

const VIDEO_CATEGORIES = [
  { key: "before_video", label: "Before — video", min: 1 },
  { key: "during_video", label: "During — video", min: 1 },
  { key: "after_video", label: "After — video", min: 1 },
  { key: "dua_video", label: "Du'a video", min: 1 },
] as const;

type CategoryKey = (typeof PHOTO_CATEGORIES)[number]["key"] | (typeof VIDEO_CATEGORIES)[number]["key"];

export function ProofUploadFormReal({ orderId, vendorId }: { orderId: string; vendorId: string }) {
  const router = useRouter();
  const [files, setFiles] = useState<Record<CategoryKey, File[]>>({
    before_photo: [], during_photo: [], after_photo: [],
    before_video: [], during_video: [], after_video: [], dua_video: [],
  });
  const [notes, setNotes] = useState("");
  const [country, setCountry] = useState("");
  const [stateProvince, setStateProvince] = useState("");
  const [village, setVillage] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const allCategories = [...PHOTO_CATEGORIES, ...VIDEO_CATEGORIES];
  const missing = allCategories.filter((c) => files[c.key].length < c.min);
  const canSubmit = missing.length === 0 && !uploading && country.trim() && village.trim();

  function setCategoryFiles(key: CategoryKey, list: FileList | null) {
    setFiles((current) => ({ ...current, [key]: Array.from(list ?? []) }));
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setMapsLink(`https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`);
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const items: { path: string; category: CategoryKey }[] = [];
      const allFiles = allCategories.flatMap((c) => files[c.key].map((file) => ({ file, category: c.key })));

      for (let i = 0; i < allFiles.length; i++) {
        const { file, category } = allFiles[i];
        setProgress(`Uploading ${i + 1} of ${allFiles.length}…`);
        const path = `${vendorId}/${orderId}/${category}-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("proofs").upload(path, file);
        if (uploadError) throw new Error(uploadError.message);
        items.push({ path, category });
      }

      setProgress("Recording completion…");
      const res = await submitProofAction(orderId, items, notes, {
        country, state: stateProvince, village, address,
        lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null, mapsLink,
      });
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
        <span className="label mb-2 block">Completion photos <span className="font-normal text-[var(--muted)]">3 before, 3 during, 3 after — 9 total</span></span>
        <div className="vendor-upload-category-grid">
          {PHOTO_CATEGORIES.map((c) => (
            <div key={c.key}>
              <div className="vendor-upload-label-row">
                <span className="text-xs font-bold">{c.label}</span>
                <span className={`vendor-upload-count ${files[c.key].length >= c.min ? "is-complete" : ""}`}>{files[c.key].length} of {c.min}</span>
              </div>
              <label className="vendor-upload-dropzone">
                <input type="file" accept="image/*" multiple className="sr-only" disabled={uploading} onChange={(e) => setCategoryFiles(c.key, e.target.files)} />
                <UploadIcon />
                {files[c.key].length === 0 ? `Choose ${c.min}+ photos` : `${files[c.key].length} selected`}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <span className="label mb-2 block">Completion videos <span className="font-normal text-[var(--muted)]">Before, during, after, and du'a — 4 total</span></span>
        <div className="vendor-upload-category-grid">
          {VIDEO_CATEGORIES.map((c) => (
            <div key={c.key}>
              <div className="vendor-upload-label-row">
                <span className="text-xs font-bold">{c.label}</span>
                <span className={`vendor-upload-count ${files[c.key].length >= c.min ? "is-complete" : ""}`}>{files[c.key].length ? "1 of 1" : "0 of 1"}</span>
              </div>
              <label className="vendor-upload-dropzone">
                <input type="file" accept="video/*" className="sr-only" disabled={uploading} onChange={(e) => setCategoryFiles(c.key, e.target.files)} />
                <UploadIcon />
                {files[c.key][0]?.name ?? "Choose video"}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="vendor-upload-label-row">
          <span className="label">Project location <span className="font-normal text-[var(--muted)]">Required</span></span>
          <button type="button" className="btn-secondary btn btn-small" disabled={locating} onClick={useMyLocation}>
            {locating ? "Locating…" : "Use my location"}
          </button>
        </div>
        <div className="admin-form-grid">
          <label className="label">Country
            <input className="input" required value={country} onChange={(e) => setCountry(e.target.value)} disabled={uploading} />
          </label>
          <label className="label">State / province
            <input className="input" value={stateProvince} onChange={(e) => setStateProvince(e.target.value)} disabled={uploading} />
          </label>
        </div>
        <div className="admin-form-grid mt-4">
          <label className="label">Village / locality
            <input className="input" required value={village} onChange={(e) => setVillage(e.target.value)} disabled={uploading} />
          </label>
          <label className="label">Exact address <span className="font-normal text-[var(--muted)]">Optional</span>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} disabled={uploading} />
          </label>
        </div>
        {lat && lng && <p className="vendor-upload-hint mt-2">GPS: {lat}, {lng}</p>}
      </div>

      <label className="label">Vendor remarks <span className="font-normal text-[var(--muted)]">Weather, challenges, anything worth noting</span>
        <textarea className="input vendor-textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={uploading} />
      </label>

      <button type="submit" className="btn" disabled={!canSubmit}>{uploading ? progress || "Submitting…" : "Submit completion"} <span aria-hidden="true">→</span></button>
      {missing.length > 0 && <p className="vendor-upload-hint">Still need: {missing.map((m) => m.label).join(", ")}.</p>}
      {missing.length === 0 && (!country.trim() || !village.trim()) && <p className="vendor-upload-hint">Country and village are required.</p>}
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
