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

export function isUnusedAdminInvitation(lastSignInAt: string | null | undefined) {
  return !lastSignInAt;
}

export function adminInviteFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const accessLevel = String(formData.get("accessLevel") ?? "");

  if (name.length < 2 || name.length > 100) return { ok: false, error: "Enter the administrator’s name." } as const;
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid administrator email." } as const;
  if (!["owner", "administrator", "operations"].includes(accessLevel)) return { ok: false, error: "Choose a valid access level." } as const;
  return { ok: true, name, email, accessLevel: accessLevel as AdminAccessLevel } as const;
}
