"use server";

import { getSiteUrl } from "@/lib/site-url";
import { consumeRateLimit, requestAddress } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = { error?: string; message?: string } | undefined;

export async function requestPasswordReset(_state: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || email.length > 254) return { error: "Enter your email address." };

  try {
    if (!await consumeRateLimit("password-reset", `${email}:${await requestAddress()}`, 3, 3600)) {
      return { error: "Too many reset requests. Wait before trying again." };
    }
  } catch {
    return { error: "Password recovery is temporarily unavailable." };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?intent=recovery&next=/update-password`,
  });

  if (error) return { error: "A reset email could not be sent right now. Please try again." };
  return { message: "If an account exists for that email, a password reset link is on its way." };
}
