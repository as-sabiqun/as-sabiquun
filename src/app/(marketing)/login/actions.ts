"use server";

import { redirect } from "next/navigation";
import { HOME_FOR_ROLE, safeRedirectPath } from "@/lib/auth-redirect";
import { createClient, getProfile } from "@/lib/supabase/server";

export type AuthState = { error: string } | undefined;

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message === "Invalid login credentials" ? "That email and password don't match." : error.message };
  }

  const profile = data.user ? await getProfile(supabase, data.user.id) : null;
  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    return { error: profile?.status === "suspended" ? "This account is suspended. Contact As-Sābiqūn for help." : "This account is not ready yet." };
  }

  const next = safeRedirectPath(String(formData.get("next") ?? ""), "");
  redirect(next || HOME_FOR_ROLE[profile.role]);
}
