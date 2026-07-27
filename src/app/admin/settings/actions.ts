"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAal2Admin } from "@/lib/auth";
import { adminInviteFields } from "@/lib/admin-users";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, isSupabaseAdminConfigured } from "@/lib/supabase/server";

function settingsRedirect(kind: "admin_message" | "admin_error", message: string): never {
  redirect(`/admin/settings?${kind}=${encodeURIComponent(message)}`);
}

async function ownerContext() {
  if (!isSupabaseAdminConfigured) return null;
  const admin = await getAal2Admin(await createClient());
  return admin?.profile.admin_owner ? { admin, service: createAdminClient() } : null;
}

export async function inviteAdminAction(formData: FormData) {
  const owner = await ownerContext();
  if (!owner) settingsRedirect("admin_error", "Only an owner administrator can invite other admins.");

  const input = adminInviteFields(formData);
  if (!input.ok) settingsRedirect("admin_error", input.error);

  const { data, error } = await owner.service.auth.admin.inviteUserByEmail(input.email, {
    data: { full_name: input.name },
    redirectTo: `${await getSiteUrl()}/auth/callback?intent=admin&next=/update-password`,
  });
  if (error || !data.user) settingsRedirect("admin_error", error?.message ?? "The invitation could not be sent.");

  const { error: profileError } = await owner.service
    .from("profiles")
    .update({
      display_name: input.name,
      role: "admin",
      status: "active",
      admin_owner: false,
    })
    .eq("id", data.user.id);

  if (profileError) {
    await owner.service.auth.admin.deleteUser(data.user.id);
    settingsRedirect("admin_error", "The invitation was not completed. No administrator account was created.");
  }

  revalidatePath("/admin/settings");
  settingsRedirect("admin_message", `Invitation sent to ${input.email}.`);
}

export async function resendAdminInvitationAction(formData: FormData) {
  const owner = await ownerContext();
  if (!owner) settingsRedirect("admin_error", "Only an owner administrator can manage other admins.");

  const targetId = String(formData.get("adminId") ?? "");
  const [{ data: profile }, { data: authData, error: authError }] = await Promise.all([
    owner.service.from("profiles").select("role, admin_owner").eq("id", targetId).maybeSingle(),
    owner.service.auth.admin.getUserById(targetId),
  ]);
  if (authError || profile?.role !== "admin" || profile.admin_owner || !authData.user?.email) {
    settingsRedirect("admin_error", "That administrator invitation cannot be resent.");
  }

  const { error } = await owner.service.auth.resetPasswordForEmail(authData.user.email, {
    redirectTo: `${await getSiteUrl()}/auth/callback?intent=admin&next=/update-password`,
  });
  if (error) settingsRedirect("admin_error", "The secure setup email could not be resent.");

  settingsRedirect("admin_message", `A fresh setup email was sent to ${authData.user.email}.`);
}

export async function setAdminStatusAction(formData: FormData) {
  const owner = await ownerContext();
  if (!owner) settingsRedirect("admin_error", "Only an owner administrator can manage other admins.");

  const targetId = String(formData.get("adminId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["active", "suspended"].includes(status)) settingsRedirect("admin_error", "Invalid administrator status.");
  if (targetId === owner.admin.user.id) settingsRedirect("admin_error", "You cannot suspend your own owner account.");

  const { data: target } = await owner.service
    .from("profiles")
    .select("role, admin_owner")
    .eq("id", targetId)
    .maybeSingle();
  if (target?.role !== "admin" || target.admin_owner) settingsRedirect("admin_error", "Owner administrator accounts cannot be changed here.");

  const { error } = await owner.service.from("profiles").update({ status }).eq("id", targetId).eq("role", "admin");
  if (error) settingsRedirect("admin_error", "The administrator’s access could not be updated.");

  revalidatePath("/admin/settings");
  settingsRedirect("admin_message", status === "active" ? "Administrator access restored." : "Administrator access suspended.");
}
