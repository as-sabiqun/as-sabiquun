"use server";

import { redirect } from "next/navigation";
import { safeVendorRedirectPath } from "@/lib/auth-redirect";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getProfile, isSupabaseAdminConfigured } from "@/lib/supabase/server";
import { hasCompleteVendorProfile } from "@/lib/vendor-profile";

export type UpdatePasswordState = { error: string } | undefined;

function partnerLoginRedirect(params: Record<string, string>) {
  redirect(`/partner-login?${new URLSearchParams(params).toString()}`);
}

export async function updatePassword(nextValue: string, _state: UpdatePasswordState, formData: FormData): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const next = safeVendorRedirectPath(nextValue);
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
    redirect("/login?error=Customer access uses an email code or Google and does not use a password.");
  }
  if (profile.role === "admin") {
    await supabase.auth.signOut();
    redirect("/admin/sign-in?error=Ask a team administrator to set a new password.");
  }

  let hasValidInvitation = false;
  let invitationId: string | null = null;
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
    invitationId = invitation.id;
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  if (hasValidInvitation) {
    if (hasCompleteVendorProfile(profile)) {
      const admin = createAdminClient();
      const { error: profileError } = await admin
        .from("profiles")
        .update({ vendor_onboarding_status: "approved", status: "active" })
        .eq("id", user.id)
        .eq("role", "vendor")
        .eq("vendor_onboarding_status", "invited");
      const { error: invitationError } = await admin
        .from("vendor_invitations")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", invitationId);
      if (profileError || invitationError) return { error: "Your password was saved, but the vendor profile could not be activated. Contact As-Sabiquun." };
      await supabase.auth.signOut();
      partnerLoginRedirect({ message: "Password saved. Sign in to open your vendor dashboard.", next });
    }
    redirect(`/partner-onboarding?${new URLSearchParams({ next }).toString()}`);
  }

  if (profile.role === "vendor" && profile.vendor_onboarding_status && profile.vendor_onboarding_status !== "approved") {
    await supabase.auth.signOut();
    partnerLoginRedirect({ message: "Password saved. Your partner account is awaiting approval.", next });
  }

  if (profile.status !== "active") {
    await supabase.auth.signOut();
    partnerLoginRedirect({ error: "This account is suspended.", next });
  }
  await supabase.auth.signOut();
  partnerLoginRedirect({ message: "Password updated. Sign in again to continue.", next });
}
