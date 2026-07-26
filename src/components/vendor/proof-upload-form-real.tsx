"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { submitProofAction } from "@/app/vendor-dashboard/actions";
import {
  draftCategoryFromPath,
  draftDisplayName,
  evidenceRequirements,
  validateEvidenceFile,
  type DraftEvidenceCategory,
  type EvidenceKind,
} from "@/lib/proof-evidence";
import { createClient } from "@/lib/supabase/client";
import { uploadResumable } from "@/lib/supabase/resumable-upload";

const photoRequirements = evidenceRequirements.filter((requirement) => requirement.kind === "photo");
const videoRequirements = evidenceRequirements.filter((requirement) => requirement.kind === "video");

type DraftEvidence = {
  path: string;
  category: DraftEvidenceCategory;
  name: string;
  sizeBytes: number;
  validationError: string | null;
};

type DraftEvidenceRow = {
  storage_path?: unknown;
  mime_type?: unknown;
  size_bytes?: unknown;
};

type FormDraft = {
  notes: string;
  country: string;
  stateProvince: string;
  village: string;
  address: string;
  lat: string;
  lng: string;
  mapsLink: string;
};

const emptyFormDraft: FormDraft = {
  notes: "", country: "", stateProvince: "", village: "", address: "", lat: "", lng: "", mapsLink: "",
};

export function ProofUploadFormReal({ orderId, vendorId }: { orderId: string; vendorId: string }) {
  const router = useRouter();
  const storageKey = `as-sabiquun:completion-draft:${vendorId}:${orderId}`;
  const [drafts, setDrafts] = useState<DraftEvidence[]>([]);
  const [form, setForm] = useState<FormDraft>(emptyFormDraft);
  const [formRestored, setFormRestored] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved) as Record<string, unknown>;
          const restored = { ...emptyFormDraft };
          for (const key of Object.keys(restored) as (keyof FormDraft)[]) {
            if (typeof parsed[key] === "string") restored[key] = parsed[key];
          }
          setForm(restored);
        }
      } catch {
        localStorage.removeItem(storageKey);
      } finally {
        setFormRestored(true);
      }
    });
    return () => { cancelled = true; };
  }, [storageKey]);

  useEffect(() => {
    if (!formRestored) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(form));
    } catch {
      // The uploaded files still persist server-side when browser storage is unavailable.
    }
  }, [form, formRestored, storageKey]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error: listError } = await createClient().rpc("list_vendor_proof_drafts", { p_order_id: orderId });
      if (cancelled) return;
      if (listError) {
        setError(`Could not restore uploaded evidence: ${listError.message}`);
      } else {
        const restored = ((data ?? []) as DraftEvidenceRow[]).flatMap((row) => {
          const path = String(row.storage_path ?? "");
          const category = draftCategoryFromPath(path);
          if (!category) return [];
          const mimeType = String(row.mime_type ?? "");
          const sizeBytes = Number(row.size_bytes ?? 0);
          return [{
            path, category, name: draftDisplayName(path), sizeBytes,
            validationError: validateEvidenceFile({ type: mimeType, size: sizeBytes }, category.endsWith("photo") ? "photo" : "video"),
          }];
        });
        setDrafts(restored);
      }
      setLoadingDrafts(false);
    })();
    return () => { cancelled = true; };
  }, [orderId]);

  const count = (category: DraftEvidenceCategory) => drafts.filter((draft) => draft.category === category && !draft.validationError).length;
  const incomplete = evidenceRequirements.filter((requirement) => count(requirement.key) !== requirement.minimum);
  const coordinatesValid = Number.isFinite(Number(form.lat)) && Number.isFinite(Number(form.lng))
    && Number(form.lat) >= -90 && Number(form.lat) <= 90 && Number(form.lng) >= -180 && Number(form.lng) <= 180;
  const locationComplete = Boolean(form.country.trim() && form.stateProvince.trim() && form.village.trim() && form.address.trim()
    && form.lat && form.lng && coordinatesValid);
  const canSubmit = incomplete.length === 0 && !busy && !loadingDrafts && locationComplete && Boolean(form.notes.trim());

  function updateForm(key: keyof FormDraft, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function addFiles(category: DraftEvidenceCategory, kind: EvidenceKind, selected: File[]) {
    if (!selected.length) return;
    const requirement = evidenceRequirements.find((item) => item.key === category);
    const validationError = selected.map((file) => validateEvidenceFile(file, kind)).find(Boolean);
    if (validationError) {
      setError(`${requirement?.label ?? "Extra evidence"}: ${validationError}`);
      return;
    }

    setBusy(true);
    setError(null);
    const supabase = createClient();
    const failures: string[] = [];

    for (let index = 0; index < selected.length; index++) {
      const file = selected[index];
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^[.-]+/, "").slice(0, 100) || `${category}-${index + 1}`;
      const path = `${vendorId}/${orderId}/drafts/${category}/${crypto.randomUUID()}--${safeName}`;
      try {
        setProgress(`Uploading ${index + 1} of ${selected.length}…`);
        if (kind === "video") {
          await uploadResumable(supabase, "proofs", path, file, (percentage) => {
            setProgress(`Uploading ${index + 1} of ${selected.length} — ${percentage}%`);
          });
        } else {
          const { error: uploadError } = await supabase.storage.from("proofs").upload(path, file, {
            contentType: file.type,
            upsert: false,
          });
          if (uploadError) throw uploadError;
        }
        setDrafts((current) => [...current, {
          path, category, name: file.name, sizeBytes: file.size, validationError: null,
        }]);
      } catch {
        failures.push(file.name);
      }
    }

    if (failures.length) setError(`Could not upload: ${failures.join(", ")}. Other successful uploads were saved.`);
    setBusy(false);
    setProgress("");
  }

  async function removeDraft(draft: DraftEvidence) {
    setBusy(true);
    setError(null);
    const { error: removeError } = await createClient().storage.from("proofs").remove([draft.path]);
    if (removeError) setError(removeError.message);
    else setDrafts((current) => current.filter((item) => item.path !== draft.path));
    setBusy(false);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Location access is not available. Enter the coordinates manually.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateForm("lat", position.coords.latitude.toFixed(6));
        updateForm("lng", position.coords.longitude.toFixed(6));
        updateForm("mapsLink", `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`);
        setLocating(false);
      },
      () => {
        setError("We could not read your location. Enter the coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setProgress("Recording completion…");

    try {
      const result = await submitProofAction(
        orderId,
        drafts.filter((draft) => !draft.validationError).map(({ path, category }) => ({ path, category })),
        form.notes.trim(),
        {
          country: form.country.trim(), state: form.stateProvince.trim(), village: form.village.trim(), address: form.address.trim(),
          lat: Number(form.lat), lng: Number(form.lng), mapsLink: form.mapsLink.trim(),
        },
      );
      if (!result.ok) throw new Error(result.error ?? "Couldn't submit completion.");
      localStorage.removeItem(storageKey);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Submission failed. Your uploaded evidence is still saved.");
      setBusy(false);
      setProgress("");
    }
  }

  const extras = drafts.filter((draft) => draft.category === "extra_photo" || draft.category === "extra_video");

  return (
    <form className="vendor-upload-form" onSubmit={submit}>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {(busy || loadingDrafts) && <p className="vendor-upload-hint" aria-live="polite">{loadingDrafts ? "Restoring saved uploads…" : progress}</p>}

      <EvidenceGroup
        title="Completion photos"
        detail="3 before, 3 during, 3 after — 9 total"
        requirements={photoRequirements}
        drafts={drafts}
        busy={busy || loadingDrafts}
        onAdd={addFiles}
        onRemove={removeDraft}
      />

      <EvidenceGroup
        title="Completion videos"
        detail="Before, during, after, and dua — 4 total"
        requirements={videoRequirements}
        drafts={drafts}
        busy={busy || loadingDrafts}
        onAdd={addFiles}
        onRemove={removeDraft}
      />

      <div>
        <span className="label mb-2 block">Extra evidence <span className="font-normal text-[var(--muted)]">Optional, separate from the required 13 files</span></span>
        <label className="vendor-upload-dropzone">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
            multiple
            className="sr-only"
            disabled={busy || loadingDrafts}
            onChange={(event) => {
              const selected = Array.from(event.currentTarget.files ?? []);
              event.currentTarget.value = "";
              const photos = selected.filter((file) => file.type.startsWith("image/"));
              const videos = selected.filter((file) => !file.type.startsWith("image/"));
              void (async () => {
                await addFiles("extra_photo", "photo", photos);
                await addFiles("extra_video", "video", videos);
              })();
            }}
          />
          <UploadIcon />
          Add optional photos or videos
        </label>
        <DraftList drafts={extras} busy={busy} onRemove={removeDraft} />
      </div>

      <div>
        <div className="vendor-upload-label-row">
          <span className="label">Project location <span className="font-normal text-[var(--muted)]">Required · saved on this device</span></span>
          <button type="button" className="btn-secondary btn btn-small" disabled={locating || busy} onClick={useMyLocation}>
            {locating ? "Locating…" : "Use my location"}
          </button>
        </div>
        <div className="admin-form-grid">
          <Field label="Country" value={form.country} setValue={(value) => updateForm("country", value)} disabled={busy} />
          <Field label="State / province / district" value={form.stateProvince} setValue={(value) => updateForm("stateProvince", value)} disabled={busy} />
        </div>
        <div className="admin-form-grid mt-4">
          <Field label="Village / locality" value={form.village} setValue={(value) => updateForm("village", value)} disabled={busy} />
          <Field label="Exact address or description" value={form.address} setValue={(value) => updateForm("address", value)} disabled={busy} />
        </div>
        <div className="admin-form-grid mt-4">
          <CoordinateField label="Latitude" value={form.lat} setValue={(value) => updateForm("lat", value)} min={-90} max={90} disabled={busy} />
          <CoordinateField label="Longitude" value={form.lng} setValue={(value) => updateForm("lng", value)} min={-180} max={180} disabled={busy} />
        </div>
        <label className="label mt-4 block">Google Maps link <span className="font-normal text-[var(--muted)]">Optional</span>
          <input className="input" type="url" value={form.mapsLink} onChange={(event) => updateForm("mapsLink", event.target.value)} disabled={busy} />
        </label>
      </div>

      <label className="label">Vendor completion remarks <span className="font-normal text-[var(--muted)]">Summary, weather, challenges, and notes</span>
        <textarea className="input vendor-textarea" rows={3} required value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} disabled={busy} />
      </label>

      <button type="submit" className="btn" disabled={!canSubmit}>
        {busy ? progress || "Submitting…" : "Submit for admin review"} <span aria-hidden="true">→</span>
      </button>
      {incomplete.length > 0 && <p className="vendor-upload-hint">Required counts must match exactly. Review: {incomplete.map((item) => item.label).join(", ")}.</p>}
      {incomplete.length === 0 && !locationComplete && <p className="vendor-upload-hint">Complete the address and valid GPS coordinates.</p>}
      {incomplete.length === 0 && locationComplete && !form.notes.trim() && <p className="vendor-upload-hint">Add the completion remarks before submitting.</p>}
    </form>
  );
}

function EvidenceGroup({
  title,
  detail,
  requirements,
  drafts,
  busy,
  onAdd,
  onRemove,
}: {
  title: string;
  detail: string;
  requirements: readonly (typeof evidenceRequirements)[number][];
  drafts: DraftEvidence[];
  busy: boolean;
  onAdd: (category: DraftEvidenceCategory, kind: EvidenceKind, files: File[]) => Promise<void>;
  onRemove: (draft: DraftEvidence) => Promise<void>;
}) {
  return (
    <div>
      <span className="label mb-2 block">{title} <span className="font-normal text-[var(--muted)]">{detail}</span></span>
      <div className="vendor-upload-category-grid">
        {requirements.map((requirement) => {
          const categoryDrafts = drafts.filter((draft) => draft.category === requirement.key);
          const validCount = categoryDrafts.filter((draft) => !draft.validationError).length;
          return (
            <div key={requirement.key}>
              <div className="vendor-upload-label-row">
                <span className="text-xs font-bold">{requirement.label}</span>
                <span className={`vendor-upload-count ${validCount === requirement.minimum ? "is-complete" : ""}`}>
                  {validCount} of {requirement.minimum}
                </span>
              </div>
              <label className="vendor-upload-dropzone">
                <input
                  type="file"
                  accept={requirement.kind === "photo" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/quicktime"}
                  multiple={requirement.kind === "photo"}
                  className="sr-only"
                  disabled={busy}
                  onChange={(event) => {
                    const selected = Array.from(event.currentTarget.files ?? []);
                    event.currentTarget.value = "";
                    void onAdd(requirement.key, requirement.kind, selected);
                  }}
                />
                <UploadIcon />
                {categoryDrafts.length ? "Add or replace evidence" : requirement.kind === "photo" ? `Choose ${requirement.minimum} photos` : "Choose MP4 or MOV"}
              </label>
              <DraftList drafts={categoryDrafts} busy={busy} onRemove={onRemove} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DraftList({ drafts, busy, onRemove }: { drafts: DraftEvidence[]; busy: boolean; onRemove: (draft: DraftEvidence) => Promise<void> }) {
  if (!drafts.length) return null;
  return (
    <ul className="mt-2 grid gap-2">
      {drafts.map((draft) => (
        <li key={draft.path} className="vendor-report-item flex items-center justify-between gap-3">
          <span className="min-w-0 text-xs text-[var(--muted)]">
            <strong className="block truncate text-[var(--ink)]">{draft.name}</strong>
            {draft.validationError ?? `${formatFileSize(draft.sizeBytes)} · Uploaded`}
          </span>
          <button type="button" className="btn-secondary btn btn-small" disabled={busy} onClick={() => void onRemove(draft)} aria-label={`Remove ${draft.name}`}>
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Saved";
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Field({ label, value, setValue, disabled }: { label: string; value: string; setValue: (value: string) => void; disabled: boolean }) {
  return <label className="label">{label}<input className="input" required value={value} onChange={(event) => setValue(event.target.value)} disabled={disabled} /></label>;
}

function CoordinateField({ label, value, setValue, min, max, disabled }: { label: string; value: string; setValue: (value: string) => void; min: number; max: number; disabled: boolean }) {
  return <label className="label">{label}<input className="input" type="number" inputMode="decimal" min={min} max={max} step="any" required value={value} onChange={(event) => setValue(event.target.value)} disabled={disabled} /></label>;
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V4M12 4 7 9M12 4l5 5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
