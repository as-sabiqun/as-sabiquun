import { Smartphone } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveAdmin, getAdminMfaState } from "@/lib/auth";
import { safeAdminRedirectPath } from "@/lib/auth-redirect";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AdminAccessLedger } from "../../admin-access-ledger";
import styles from "../../admin-access.module.css";
import { MfaAccountEscape, MfaEnrollmentForm } from "../forms";

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
    <section
      className={styles.shell}
      aria-labelledby="admin-mfa-enroll-title"
      data-design-contract="THESIS: authenticator enrollment establishes the active second checkpoint in one protected operations route, not a generic QR card. OWN-WORLD: manuscript ivory, white setup paper, deep operational teal, warm ink, rare gold current-state detail, admin display and sans facts. STORY: confirm credentials are complete, connect an authenticator, verify one code, continue to the requested console page. FIRST VIEWPORT: completed credentials and active authenticator ledger left, setup task right with the primary action visible. FORM: inherited operations access ledger, seed 9c23affc. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md"
    >
      <div className={`${styles.frame} ${styles.enrollmentFrame}`}>
        <div className={`${styles.credentialSheet} ${styles.enrollmentSheet}`}>
          <div className={styles.formIntro}>
            <span className={styles.formIcon} aria-hidden="true"><Smartphone /></span>
            <div>
              <h1 id="admin-mfa-enroll-title">Set up your authenticator.</h1>
              <p>Connect an authenticator app, then confirm it with one six-digit code.</p>
            </div>
          </div>
          <MfaEnrollmentForm next={next} />
          <MfaAccountEscape next={next} />
        </div>
        <AdminAccessLedger
          currentStage="authenticator"
          heading="Secure the route."
          description="Connect an authenticator once, then use its changing code whenever the console requires verification."
        />
      </div>
    </section>
  );
}
