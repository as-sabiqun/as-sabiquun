"use server";

import { redirect } from "next/navigation";
import { getAdminMfaState } from "@/lib/auth";
import { safeAdminRedirectPath } from "@/lib/auth-redirect";
import { consumeRateLimit, requestAddress } from "@/lib/rate-limit";
import { createClient, getProfile } from "@/lib/supabase/server";

export type AdminLoginState = { error: string } | undefined;

export async function adminLogin(_state: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password || email.length > 254 || password.length > 1024) {
    return { error: "Enter your administrator email and password." };
  }

  try {
    if (!await consumeRateLimit("admin-login", `${email}:${await requestAddress()}`, 8, 900)) {
      return { error: "Too many sign-in attempts. Wait 15 minutes and try again." };
    }
  } catch {
    return { error: "Administrator sign-in is temporarily unavailable." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Those administrator credentials are not valid." };

  const profile = await getProfile(supabase, data.user.id);
  if (profile?.role !== "admin" || profile.status !== "active") {
    await supabase.auth.signOut();
    return { error: profile?.status === "suspended" ? "This administrator account is suspended." : "Those administrator credentials are not valid." };
  }

  const next = safeAdminRedirectPath(String(formData.get("next") ?? ""));
  const mfaState = await getAdminMfaState(supabase);
  if (mfaState === "verified") redirect(next);
  if (mfaState === "challenge") redirect(`/admin/mfa/challenge?next=${encodeURIComponent(next)}`);
  if (mfaState === "enroll") redirect(`/admin/mfa/enroll?next=${encodeURIComponent(next)}`);
  return { error: "We could not verify this administrator session. Please try again." };
}
