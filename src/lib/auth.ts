import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cache } from "react";
import { getCurrentUser, getProfile, type AdminAccessLevel, type Profile } from "@/lib/supabase/server";

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

const adminAccessRank: Record<AdminAccessLevel, number> = {
  operations: 1,
  administrator: 2,
  owner: 3,
};

export function adminAccessLevel(profile: Profile): AdminAccessLevel {
  return profile.admin_access_level ?? (profile.admin_owner ? "owner" : "administrator");
}

export function adminHasAccess(profile: Profile, required: AdminAccessLevel): boolean {
  return adminAccessRank[adminAccessLevel(profile)] >= adminAccessRank[required];
}

export const getAal2AdminAtLeast = cache(async (supabase: SupabaseClient, required: AdminAccessLevel) => {
  const admin = await getAal2Admin(supabase);
  return admin && adminHasAccess(admin.profile, required) ? admin : null;
});

export function isApprovedVendor(profile: Profile | null): profile is Profile {
  return Boolean(profile && profile.role === "vendor" && profile.status === "active" && profile.vendor_onboarding_status === "approved");
}

export async function isCustomerAccount(_supabase: SupabaseClient, user: User, profile: Profile | null): Promise<boolean> {
  return Boolean(
    user.email
    && user.email_confirmed_at
    && profile?.role === "customer"
    && profile.status === "active"
  );
}

export function customerAccessMessage(profile: Profile | null) {
  if (profile?.status === "suspended") return "This customer account is suspended. Contact As-Sabiqun for help.";
  if (profile && profile.role !== "customer") return "This is a staff or partner account. Sign out and use a customer email to place an order.";
  return "This account is not ready for customer orders yet. Sign out and try again with your customer email.";
}

export function vendorAccessMessage(profile: Profile | null) {
  if (!profile || profile.role !== "vendor") return "This account is not a fulfilment-partner account.";
  if (profile.status === "suspended") return "This partner account is suspended. Contact As-Sabiquun for help.";
  if (profile.vendor_onboarding_status === "invited") return "Finish setting your password from the invitation email first.";
  if (profile.vendor_onboarding_status === "pending") return "Your partner account is awaiting approval.";
  if (profile.vendor_onboarding_status === "rejected") return "This partner application was not approved. Contact As-Sabiquun for help.";
  return "This partner account is not ready yet.";
}
