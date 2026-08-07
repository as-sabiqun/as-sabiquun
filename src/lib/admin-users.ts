import type { AdminAccessLevel } from "./supabase/server.ts";

export const adminAccessLabels: Record<AdminAccessLevel, string> = {
  owner: "Owner",
  administrator: "Administrator",
  operations: "Operations Staff",
};

export function canAssignAdminAccess(actor: AdminAccessLevel, requested: AdminAccessLevel) {
  return actor === "owner" || (actor === "administrator" && requested === "operations");
}

export function canManageAdminAccess(actor: AdminAccessLevel, target: AdminAccessLevel) {
  return actor === "owner" || (actor === "administrator" && target === "operations");
}

export function canRemoveAdminUser(actor: AdminAccessLevel, isSelf: boolean) {
  return actor === "owner" && !isSelf;
}

export function adminAccountFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const accessLevel = String(formData.get("accessLevel") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (name.length < 2 || name.length > 100) return { ok: false, error: "Enter the administrator’s name." } as const;
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid administrator email." } as const;
  if (!["owner", "administrator", "operations"].includes(accessLevel)) return { ok: false, error: "Choose a valid access level." } as const;
  if (password.length < 12 || password.length > 72) return { ok: false, error: "Use a password between 12 and 72 characters." } as const;
  if (password !== confirmation) return { ok: false, error: "The passwords do not match." } as const;
  return { ok: true, name, email, accessLevel: accessLevel as AdminAccessLevel, password } as const;
}

export function adminPasswordFields(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 12 || password.length > 72) return { ok: false, error: "Use a password between 12 and 72 characters." } as const;
  if (password !== confirmation) return { ok: false, error: "The passwords do not match." } as const;
  return { ok: true, password } as const;
}
