export const evidenceRequirements = [
  { key: "before_photo", label: "Before photos", kind: "photo", minimum: 3 },
  { key: "during_photo", label: "During photos", kind: "photo", minimum: 3 },
  { key: "after_photo", label: "After photos", kind: "photo", minimum: 3 },
  { key: "before_video", label: "Before video", kind: "video", minimum: 1 },
  { key: "during_video", label: "During video", kind: "video", minimum: 1 },
  { key: "after_video", label: "After video", kind: "video", minimum: 1 },
  { key: "dua_video", label: "Dua video", kind: "video", minimum: 1 },
] as const;

export type EvidenceCategory = (typeof evidenceRequirements)[number]["key"];
export type EvidenceKind = (typeof evidenceRequirements)[number]["kind"];
export type DraftEvidenceCategory = EvidenceCategory | "extra_photo" | "extra_video";

const draftCategories = new Set<DraftEvidenceCategory>([
  ...evidenceRequirements.map((requirement) => requirement.key),
  "extra_photo",
  "extra_video",
]);

const photoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const videoTypes = new Set(["video/mp4", "video/quicktime"]);

export const evidenceLimits = {
  photo: 10 * 1024 * 1024,
  video: 250 * 1024 * 1024,
} as const;

export function validateEvidenceFile(file: Pick<File, "size" | "type">, kind: EvidenceKind): string | null {
  const allowed = kind === "photo" ? photoTypes : videoTypes;
  if (!allowed.has(file.type.toLowerCase())) {
    return kind === "photo" ? "Use a JPEG, PNG, or WebP image." : "Use an MP4 or MOV video.";
  }
  if (file.size <= 0) return "The file is empty.";
  if (file.size > evidenceLimits[kind]) {
    return `${kind === "photo" ? "Photos" : "Videos"} must be ${kind === "photo" ? "10 MB" : "250 MB"} or smaller.`;
  }
  return null;
}

export function draftCategoryFromPath(path: string): DraftEvidenceCategory | null {
  const parts = path.split("/");
  const draftIndex = parts.indexOf("drafts");
  const folder = parts[draftIndex + 1] as DraftEvidenceCategory | undefined;
  if (folder && draftCategories.has(folder)) return folder;

  const legacyName = parts.at(-1)?.split(".")[0] as DraftEvidenceCategory | undefined;
  return legacyName && draftCategories.has(legacyName) ? legacyName : null;
}

export function draftDisplayName(path: string): string {
  const name = path.split("/").at(-1) || "Evidence file";
  return name.replace(/^[0-9a-f-]{36}--/i, "");
}
