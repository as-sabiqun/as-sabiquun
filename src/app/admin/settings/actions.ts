"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAccessLevel, getAal2AdminAtLeast } from "@/lib/auth";
import { adminInviteFields, canAssignAdminAccess, canManageAdminAccess, isUnusedAdminInvitation } from "@/lib/admin-users";
import { getSiteUrl } from "@/lib/site-url";
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

export async function inviteAdminAction(formData: FormData) {
  const actor = await teamContext();
  if (!actor) settingsRedirect("admin_error", "Administrator access is required to invite team members.");

  const input = adminInviteFields(formData);
  if (!input.ok) settingsRedirect("admin_error", input.error);
  if (!canAssignAdminAccess(actor.level, input.accessLevel)) {
    settingsRedirect("admin_error", "You cannot grant that access level.");
  }

  const { data, error } = await actor.service.auth.admin.inviteUserByEmail(input.email, {
    data: { full_name: input.name },
    redirectTo: `${await getSiteUrl()}/auth/callback?intent=admin&next=/update-password`,
  });
  if (error || !data.user) settingsRedirect("admin_error", error?.message ?? "The invitation could not be sent.");

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
    settingsRedirect("admin_error", "The invitation was not completed. No administrator account was created.");
  }

  revalidatePath("/admin/settings");
  settingsRedirect("admin_message", `Invitation sent to ${input.email}.`);
}

export async function resendAdminInvitationAction(formData: FormData) {
  const actor = await teamContext();
  if (!actor) settingsRedirect("admin_error", "Administrator access is required to manage team invitations.");

  const targetId = String(formData.get("adminId") ?? "");
  if (targetId === actor.admin.user.id) settingsRedirect("admin_error", "You cannot resend setup for your own account.");
  const [{ data: profile }, { data: authData, error: authError }] = await Promise.all([
    actor.service.from("profiles").select("role, admin_access_level").eq("id", targetId).maybeSingle(),
    actor.service.auth.admin.getUserById(targetId),
  ]);
  if (
    authError
    || profile?.role !== "admin"
    || !profile.admin_access_level
    || !canManageAdminAccess(actor.level, profile.admin_access_level)
    || !authData.user?.email
  ) {
    settingsRedirect("admin_error", "That administrator invitation cannot be resent.");
  }

  const { error } = await actor.service.auth.resetPasswordForEmail(authData.user.email, {
    redirectTo: `${await getSiteUrl()}/auth/callback?intent=admin&next=/update-password`,
  });
  if (error) settingsRedirect("admin_error", "The secure setup email could not be resent.");

  settingsRedirect("admin_message", `A fresh setup email was sent to ${authData.user.email}.`);
}

export async function retractAdminInvitationAction(formData: FormData) {
  const actor = await teamContext();
  if (!actor) settingsRedirect("admin_error", "Administrator access is required to manage team invitations.");

  const targetId = String(formData.get("adminId") ?? "");
  if (targetId === actor.admin.user.id) settingsRedirect("admin_error", "You cannot revoke your own account.");
  const [{ data: profile }, { data: authData, error: authError }] = await Promise.all([
    actor.service.from("profiles").select("role, admin_access_level").eq("id", targetId).maybeSingle(),
    actor.service.auth.admin.getUserById(targetId),
  ]);
  if (
    authError
    || profile?.role !== "admin"
    || !profile.admin_access_level
    || !canManageAdminAccess(actor.level, profile.admin_access_level)
    || !authData.user
    || !isUnusedAdminInvitation(authData.user?.last_sign_in_at)
  ) {
    settingsRedirect("admin_error", "Only an unused invitation can be revoked.");
  }

  const { error } = await actor.service.auth.admin.deleteUser(targetId);
  if (error) settingsRedirect("admin_error", "The invitation could not be revoked. Please try again.");

  revalidatePath("/admin/settings");
  settingsRedirect("admin_message", "Invitation revoked. You can now invite that email again.");
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
