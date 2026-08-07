"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAccessLevel, getAal2AdminAtLeast } from "@/lib/auth";
import { adminAccountFields, adminPasswordFields, canAssignAdminAccess, canManageAdminAccess, canRemoveAdminUser } from "@/lib/admin-users";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, isSupabaseAdminConfigured } from "@/lib/supabase/server";

function settingsRedirect(kind: "admin_message" | "admin_error", message: string): never {
  redirect(`/admin/settings?${kind}=${encodeURIComponent(message)}`);
}

async function teamContext() {
  if (!isSupabaseAdminConfigured) return null;
  const admin = await getAal2AdminAtLeast(await createClient(), "administrator");
  return admin ? { admin, level: adminAccessLevel(admin.profile), service: createAdminClient() } : null;
}

export async function createAdminAccountAction(formData: FormData) {
  const actor = await teamContext();
  if (!actor) settingsRedirect("admin_error", "Administrator access is required to create team accounts.");

  const input = adminAccountFields(formData);
  if (!input.ok) settingsRedirect("admin_error", input.error);
  if (!canAssignAdminAccess(actor.level, input.accessLevel)) {
    settingsRedirect("admin_error", "You cannot grant that access level.");
  }

  const { data, error } = await actor.service.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.name },
  });
  if (error || !data.user) {
    const duplicate = error?.message.toLowerCase().includes("already") || error?.message.toLowerCase().includes("registered");
    settingsRedirect("admin_error", duplicate ? "That email already has an account. Set its password below or remove the old account first." : "The administrator account could not be created.");
  }

  const { error: profileError } = await actor.service
    .from("profiles")
    .update({
      display_name: input.name,
      role: "admin",
      status: "active",
      admin_owner: input.accessLevel === "owner",
      admin_access_level: input.accessLevel,
    })
    .eq("id", data.user.id);

  if (profileError) {
    await actor.service.auth.admin.deleteUser(data.user.id);
    settingsRedirect("admin_error", "The administrator profile was not completed. No account was created.");
  }

  revalidatePath("/admin/settings");
  settingsRedirect("admin_message", `Account ready for ${input.email}. Share the sign-in details securely.`);
}

export async function setAdminPasswordAction(formData: FormData) {
  const actor = await teamContext();
  if (!actor) settingsRedirect("admin_error", "Administrator access is required to manage team passwords.");

  const targetId = String(formData.get("adminId") ?? "");
  if (targetId === actor.admin.user.id) settingsRedirect("admin_error", "Ask another owner to change your password.");
  const input = adminPasswordFields(formData);
  if (!input.ok) settingsRedirect("admin_error", input.error);

  const { data: profile } = await actor.service
    .from("profiles")
    .select("role, admin_access_level")
    .eq("id", targetId)
    .maybeSingle();
  if (
    profile?.role !== "admin"
    || !profile.admin_access_level
    || !canManageAdminAccess(actor.level, profile.admin_access_level)
  ) {
    settingsRedirect("admin_error", "You cannot change that team member’s password.");
  }

  const { error } = await actor.service.auth.admin.updateUserById(targetId, {
    password: input.password,
    email_confirm: true,
  });
  if (error) settingsRedirect("admin_error", "The password could not be updated. Please try again.");

  revalidatePath("/admin/settings");
  settingsRedirect("admin_message", "Password updated. The administrator can sign in directly now.");
}

export async function removeAdminAction(formData: FormData) {
  const actor = await teamContext();
  if (!actor || actor.level !== "owner") settingsRedirect("admin_error", "Only an owner can remove a team member.");

  const targetId = String(formData.get("adminId") ?? "");
  if (!canRemoveAdminUser(actor.level, targetId === actor.admin.user.id)) {
    settingsRedirect("admin_error", "You cannot remove your own account.");
  }
  const { data: target } = await actor.service
    .from("profiles")
    .select("role, status, admin_access_level")
    .eq("id", targetId)
    .maybeSingle();
  if (target?.role !== "admin" || !target.admin_access_level) {
    settingsRedirect("admin_error", "That team member was not found.");
  }
  if (target.admin_access_level === "owner" && target.status === "active") {
    const { count } = await actor.service
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("admin_access_level", "owner")
      .eq("status", "active");
    if ((count ?? 0) <= 1) settingsRedirect("admin_error", "The final active owner cannot be removed.");
  }

  const { error } = await actor.service.auth.admin.deleteUser(targetId);
  if (error) settingsRedirect("admin_error", "This member has operational activity on record. Suspend them instead to preserve the audit trail.");

  revalidatePath("/admin/settings");
  settingsRedirect("admin_message", "Team member removed. You can create their account again whenever needed.");
}

export async function setAdminStatusAction(formData: FormData) {
  const actor = await teamContext();
  if (!actor) settingsRedirect("admin_error", "Administrator access is required to manage team access.");

  const targetId = String(formData.get("adminId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["active", "suspended"].includes(status)) settingsRedirect("admin_error", "Invalid administrator status.");
  if (targetId === actor.admin.user.id) settingsRedirect("admin_error", "You cannot suspend your own account.");

  const { data: target } = await actor.service
    .from("profiles")
    .select("role, admin_access_level")
    .eq("id", targetId)
    .maybeSingle();
  if (
    target?.role !== "admin"
    || !target.admin_access_level
    || !canManageAdminAccess(actor.level, target.admin_access_level)
  ) {
    settingsRedirect("admin_error", "You cannot change that team member.");
  }
  if (target.admin_access_level === "owner" && status === "suspended") {
    const { count } = await actor.service.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin").eq("admin_access_level", "owner").eq("status", "active");
    if ((count ?? 0) <= 1) settingsRedirect("admin_error", "The final active owner cannot be suspended.");
  }

  const { error } = await actor.service.from("profiles").update({ status }).eq("id", targetId).eq("role", "admin");
  if (error) settingsRedirect("admin_error", "The administrator’s access could not be updated.");

  revalidatePath("/admin/settings");
  settingsRedirect("admin_message", status === "active" ? "Administrator access restored." : "Administrator access suspended.");
}

export async function setAdminAccessLevelAction(formData: FormData) {
  const actor = await teamContext();
  if (!actor || actor.level !== "owner") settingsRedirect("admin_error", "Only an owner can change authority levels.");

  const targetId = String(formData.get("adminId") ?? "");
  const accessLevel = String(formData.get("accessLevel") ?? "");
  if (!["owner", "administrator", "operations"].includes(accessLevel)) settingsRedirect("admin_error", "Invalid access level.");
  if (targetId === actor.admin.user.id) settingsRedirect("admin_error", "You cannot change your own authority level.");

  const { data: target } = await actor.service
    .from("profiles")
    .select("role, admin_access_level")
    .eq("id", targetId)
    .maybeSingle();
  if (target?.role !== "admin" || !target.admin_access_level) settingsRedirect("admin_error", "That team member was not found.");

  if (target.admin_access_level === "owner" && accessLevel !== "owner") {
    const { count } = await actor.service.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin").eq("admin_access_level", "owner").eq("status", "active");
    if ((count ?? 0) <= 1) settingsRedirect("admin_error", "The final active owner cannot be demoted.");
  }

  const { error } = await actor.service
    .from("profiles")
    .update({ admin_access_level: accessLevel, admin_owner: accessLevel === "owner" })
    .eq("id", targetId)
    .eq("role", "admin");
  if (error) settingsRedirect("admin_error", "The authority level could not be updated.");

  revalidatePath("/admin/settings");
  settingsRedirect("admin_message", "Team authority updated.");
}
