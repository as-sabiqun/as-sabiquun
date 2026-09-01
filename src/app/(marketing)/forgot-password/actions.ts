"use server";

import { getSiteUrl } from "@/lib/site-url";
import { safeVendorRedirectPath } from "@/lib/auth-redirect";
import { consumeRateLimit, requestAddress } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = { error?: string; message?: string; email?: string } | undefined;

export async function requestPasswordReset(context: string, nextValue: string, _state: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const isPartner = context === "partner";
  const next = safeVendorRedirectPath(nextValue);
  if (!email || email.length > 254) return { error: "Enter your email address.", email };

  try {
    if (!await consumeRateLimit("password-reset", `${email}:${await requestAddress()}`, 3, 3600)) {
      return { error: "Too many reset requests. Wait before trying again.", email };
    }
  } catch {
    return { error: "Password recovery is temporarily unavailable.", email };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const updatePasswordPath = isPartner
    ? `/update-password?context=partner&next=${encodeURIComponent(next)}`
    : "/update-password";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?intent=recovery&next=${encodeURIComponent(updatePasswordPath)}`,
  });

  if (error) return { error: "A reset email could not be sent right now. Please try again.", email };
  return { message: "If an account exists for that email, a password reset link is on its way.", email };
}
