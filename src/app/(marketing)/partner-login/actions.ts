"use server";

import { redirect } from "next/navigation";
import { isApprovedVendor, vendorAccessMessage } from "@/lib/auth";
import { safeVendorRedirectPath } from "@/lib/auth-redirect";
import { consumeRateLimit, requestAddress } from "@/lib/rate-limit";
import { createClient, getProfile } from "@/lib/supabase/server";

export type PartnerLoginState = { error: string } | undefined;

export async function partnerLogin(_state: PartnerLoginState, formData: FormData): Promise<PartnerLoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password || email.length > 254 || password.length > 1024) {
    return { error: "Enter your partner email and password." };
  }

  try {
    if (!await consumeRateLimit("partner-login", `${email}:${await requestAddress()}`, 10, 900)) {
      return { error: "Too many sign-in attempts. Wait 15 minutes and try again." };
    }
  } catch {
    return { error: "Partner sign-in is temporarily unavailable." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "That email and password do not match a partner account." };

  const profile = await getProfile(supabase, data.user.id);
  if (!isApprovedVendor(profile)) {
    await supabase.auth.signOut();
    return { error: vendorAccessMessage(profile) };
  }

  redirect(safeVendorRedirectPath(String(formData.get("next") ?? "")));
}
