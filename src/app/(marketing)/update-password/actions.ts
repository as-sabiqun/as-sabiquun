"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getProfile, isSupabaseAdminConfigured } from "@/lib/supabase/server";

export type UpdatePasswordState = { error: string } | undefined;

export async function updatePassword(_state: UpdatePasswordState, formData: FormData): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmation) return { error: "The passwords do not match." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your reset link has expired. Request a new one." };

  const profile = await getProfile(supabase, user.id);
  if (!profile) {
    await supabase.auth.signOut();
    redirect("/login?error=This account is not ready yet.");
  }
  if (profile.role === "customer") {
    await supabase.auth.signOut();
    redirect("/login?error=Customer access uses Google sign-in and does not use a password.");
  }

  let hasValidInvitation = false;
  if (profile.role === "vendor" && profile.vendor_onboarding_status === "invited") {
    if (!isSupabaseAdminConfigured) return { error: "Partner onboarding is not configured. Contact As-Sabiquun for help." };
    const now = new Date().toISOString();
    const { data: invitation, error: invitationError } = await createAdminClient()
      .from("vendor_invitations")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("status", "invited")
      .gt("expires_at", now)
      .maybeSingle();
    if (invitationError || !invitation) return { error: "This invitation has expired. Ask an administrator to send a new one." };
    hasValidInvitation = true;
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  if (hasValidInvitation) {
    redirect("/partner-onboarding");
  }

  if (profile.role === "vendor" && profile.vendor_onboarding_status && profile.vendor_onboarding_status !== "approved") {
    await supabase.auth.signOut();
    redirect("/partner-login?message=Password saved. Your partner account is awaiting approval.");
  }

  if (profile.status !== "active") {
    await supabase.auth.signOut();
    redirect(profile.role === "admin" ? "/admin/sign-in?error=This account is suspended." : profile.role === "vendor" ? "/partner-login?error=This account is suspended." : "/login?error=This account is suspended.");
  }
  await supabase.auth.signOut();
  redirect(profile.role === "admin"
    ? "/admin/sign-in?message=Password updated. Sign in again to continue."
    : "/partner-login?message=Password updated. Sign in again to continue.");
}
