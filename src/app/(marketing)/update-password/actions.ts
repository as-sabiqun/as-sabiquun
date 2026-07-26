"use server";

import { redirect } from "next/navigation";
import { HOME_FOR_ROLE } from "@/lib/auth-redirect";
import { createClient, getProfile } from "@/lib/supabase/server";

export type UpdatePasswordState = { error: string } | undefined;

export async function updatePassword(_state: UpdatePasswordState, formData: FormData): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmation) return { error: "The passwords do not match." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your reset link has expired. Request a new one." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  const profile = await getProfile(supabase, user.id);
  redirect(profile && profile.status === "active" ? HOME_FOR_ROLE[profile.role] : "/login");
}
