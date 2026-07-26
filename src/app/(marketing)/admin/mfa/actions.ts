"use server";

import { redirect } from "next/navigation";
import { getActiveAdmin, getAdminMfaState } from "@/lib/auth";
import { safeAdminRedirectPath } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

export type MfaEnrollmentState =
  | { error: string; enrollment?: never }
  | { error?: never; enrollment: { factorId: string; qrCode: string; secret: string } }
  | undefined;

export type MfaVerificationState = { error: string } | undefined;

export async function beginMfaEnrollment(_state: MfaEnrollmentState): Promise<MfaEnrollmentState> {
  void _state;
  const supabase = await createClient();
  if (!(await getActiveAdmin(supabase))) return { error: "Administrator access is required." };

  const mfaState = await getAdminMfaState(supabase);
  if (mfaState === "error") return { error: "Authenticator setup is unavailable right now. Please try again." };
  if (mfaState === "verified" || mfaState === "challenge") {
    return { error: "An authenticator is already enrolled. Use the verification screen instead." };
  }

  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const factor of factors?.all ?? []) {
    if (factor.factor_type === "totp" && factor.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "As-Sabiquun Admin",
    issuer: "As-Sabiquun",
  });
  if (error) return { error: "Authenticator setup could not be started. Please try again." };

  return { enrollment: { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret } };
}

export async function verifyMfaEnrollment(_state: MfaVerificationState, formData: FormData): Promise<MfaVerificationState> {
  const factorId = String(formData.get("factorId") ?? "");
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!/^[0-9]{6}$/.test(code)) return { error: "Enter the six-digit code from your authenticator app." };

  const supabase = await createClient();
  if (!(await getActiveAdmin(supabase))) return { error: "Administrator access is required." };
  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
  const factor = factors?.all.find((item) => item.id === factorId && item.factor_type === "totp" && item.status === "unverified");
  if (factorsError || !factor) return { error: "This setup session has expired. Start again." };

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return { error: "That code was not accepted. Check your authenticator and try again." };

  redirect(safeAdminRedirectPath(String(formData.get("next") ?? "")));
}

export async function verifyMfaChallenge(_state: MfaVerificationState, formData: FormData): Promise<MfaVerificationState> {
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!/^[0-9]{6}$/.test(code)) return { error: "Enter the six-digit code from your authenticator app." };

  const supabase = await createClient();
  if (!(await getActiveAdmin(supabase))) return { error: "Administrator access is required." };
  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp[0];
  if (factorsError || !factor) redirect("/admin/mfa/enroll");

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
  if (error) return { error: "That code was not accepted. Try the current code from your authenticator app." };

  redirect(safeAdminRedirectPath(String(formData.get("next") ?? "")));
}
