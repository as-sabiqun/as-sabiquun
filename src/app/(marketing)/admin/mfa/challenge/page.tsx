import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveAdmin, getAdminMfaState } from "@/lib/auth";
import { safeAdminRedirectPath } from "@/lib/auth-redirect";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MfaChallengeForm } from "../forms";

export const metadata: Metadata = { title: "Verify administrator access", robots: { index: false, follow: false } };

export default async function AdminMfaChallengePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!isSupabaseConfigured) redirect("/admin/sign-in?error=Admin access is not configured.");
  const next = safeAdminRedirectPath((await searchParams).next);
  const supabase = await createClient();
  if (!(await getActiveAdmin(supabase))) redirect("/admin/sign-in");
  const state = await getAdminMfaState(supabase);
  if (state === "verified") redirect(next);
  if (state === "enroll") redirect(`/admin/mfa/enroll?next=${encodeURIComponent(next)}`);
  if (state === "error") redirect("/admin/sign-in?error=Authenticator verification is unavailable. Please sign in again.");

  return (
    <section className="auth-shell">
      <div className="container flex justify-center">
        <div className="card auth-card">
          <p className="auth-eyebrow">Two-step verification</p>
          <h1 className="display auth-title">Enter your authenticator code</h1>
          <p className="auth-lead">Use the current six-digit code for your administrator account.</p>
          <MfaChallengeForm next={next} />
        </div>
      </div>
    </section>
  );
}
