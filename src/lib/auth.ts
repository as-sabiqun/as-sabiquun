import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cache } from "react";
import { isAdminMfaBypassActive } from "@/lib/auth-policy";
import { getCurrentUser, getProfile, type Profile } from "@/lib/supabase/server";

export type AdminMfaState = "verified" | "challenge" | "enroll" | "error";

export const sessionUsesAuthMethod = cache(async (supabase: SupabaseClient, method: string) => {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return false;
  return data.currentAuthenticationMethods.some((entry) =>
    (typeof entry === "string" ? entry : entry.method) === method
  );
});

export const getActiveAdmin = cache(async (supabase: SupabaseClient): Promise<{ user: User; profile: Profile } | null> => {
  const user = await getCurrentUser(supabase);
  if (!user) return null;

  const profile = await getProfile(supabase, user.id);
  return profile?.role === "admin"
    && profile.status === "active"
    && await sessionUsesAuthMethod(supabase, "password")
    ? { user, profile }
    : null;
});

export const getAdminMfaState = cache(async (supabase: SupabaseClient): Promise<AdminMfaState> => {
  if (isAdminMfaBypassActive()) return "verified";
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return "error";
  if (data.currentLevel === "aal2") return "verified";
  return data.nextLevel === "aal2" ? "challenge" : "enroll";
});

export const getAal2Admin = cache(async (supabase: SupabaseClient) => {
  const admin = await getActiveAdmin(supabase);
  if (!admin || (await getAdminMfaState(supabase)) !== "verified") return null;
  return admin;
});

export function isApprovedVendor(profile: Profile | null): profile is Profile {
  return Boolean(profile && profile.role === "vendor" && profile.status === "active" && profile.vendor_onboarding_status === "approved");
}

export async function isGoogleCustomer(supabase: SupabaseClient, user: User, profile: Profile | null): Promise<boolean> {
  const providers = Array.isArray(user.app_metadata.providers)
    ? user.app_metadata.providers
    : [user.app_metadata.provider];
  return Boolean(
    user.email
    && user.email_confirmed_at
    && providers.includes("google")
    && profile?.role === "customer"
    && profile.status === "active"
    && await sessionUsesAuthMethod(supabase, "oauth"),
  );
}

export function vendorAccessMessage(profile: Profile | null) {
  if (!profile || profile.role !== "vendor") return "This account is not a fulfilment-partner account.";
  if (profile.status === "suspended") return "This partner account is suspended. Contact As-Sabiquun for help.";
  if (profile.vendor_onboarding_status === "invited") return "Finish setting your password from the invitation email first.";
  if (profile.vendor_onboarding_status === "pending") return "Your partner account is awaiting approval.";
  if (profile.vendor_onboarding_status === "rejected") return "This partner application was not approved. Contact As-Sabiquun for help.";
  return "This partner account is not ready yet.";
}
