import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveAdmin, getAdminMfaState } from "@/lib/auth";
import { safeAdminRedirectPath } from "@/lib/auth-redirect";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MfaEnrollmentForm } from "../forms";

export const metadata: Metadata = { title: "Secure administrator access", robots: { index: false, follow: false } };

export default async function AdminMfaEnrollPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!isSupabaseConfigured) redirect("/admin/sign-in?error=Admin access is not configured.");
  const next = safeAdminRedirectPath((await searchParams).next);
  const supabase = await createClient();
  if (!(await getActiveAdmin(supabase))) redirect("/admin/sign-in");
  const state = await getAdminMfaState(supabase);
  if (state === "verified") redirect(next);
  if (state === "challenge") redirect(`/admin/mfa/challenge?next=${encodeURIComponent(next)}`);
  if (state === "error") redirect("/admin/sign-in?error=Authenticator verification is unavailable. Please sign in again.");

  return (
    <section className="auth-shell">
      <div className="container flex justify-center">
        <div className="card auth-card">
          <p className="auth-eyebrow">Required security</p>
          <h1 className="display auth-title">Protect the admin console</h1>
          <p className="auth-lead">Scan the QR code with an authenticator app. Every administrator must complete this once.</p>
          <MfaEnrollmentForm next={next} />
        </div>
      </div>
    </section>
  );
}
