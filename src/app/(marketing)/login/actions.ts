"use server";

import { redirect } from "next/navigation";
import { createClient, getProfile } from "@/lib/supabase/server";

export type AuthState = { error: string } | undefined;

const HOME_FOR_ROLE = { customer: "/dashboard", vendor: "/vendor-dashboard", admin: "/admin" } as const;

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message === "Invalid login credentials" ? "That email and password don't match." : error.message };
  }

  const next = String(formData.get("next") ?? "/");
  if (next && next !== "/" && next.startsWith("/")) {
    redirect(next);
  }

  // No explicit destination requested — send them to their own home base.
  const profile = data.user ? await getProfile(supabase, data.user.id) : null;
  redirect(profile ? HOME_FOR_ROLE[profile.role] : "/");
}
