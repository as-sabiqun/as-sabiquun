import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveAdmin, getAdminMfaState } from "@/lib/auth";
import { safeAdminRedirectPath } from "@/lib/auth-redirect";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AdminAccessLedger } from "../../admin-access-ledger";
import styles from "../../admin-access.module.css";
import { MfaAccountEscape, MfaChallengeForm } from "../forms";

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
    <section
      className={styles.shell}
      aria-labelledby="admin-mfa-challenge-title"
      data-design-contract="THESIS: authenticator challenge is the active second checkpoint in one protected operations route, not a detached OTP card. OWN-WORLD: manuscript ivory, white verification paper, deep operational teal, warm ink, rare gold current-state detail, admin display and sans facts. STORY: confirm credentials are complete, enter the current authenticator code, continue to the requested console page. FIRST VIEWPORT: completed credentials and active authenticator ledger left, compact verification task right, action above the fold. FORM: inherited operations access ledger, seed 9c23affc. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md"
    >
      <div className={styles.frame}>
        <div className={`${styles.credentialSheet} ${styles.mfaSheet}`}>
          <div className={styles.formIntro}>
            <span className={styles.formIcon} aria-hidden="true"><ShieldCheck /></span>
            <div>
              <h1 id="admin-mfa-challenge-title">Verify administrator access.</h1>
              <p>Enter the current six-digit code from your authenticator app.</p>
            </div>
          </div>
          <MfaChallengeForm next={next} />
          <p className={styles.mfaNote}><ShieldCheck aria-hidden="true" /> Codes refresh regularly. Use the code currently shown in your app.</p>
          <MfaAccountEscape next={next} />
        </div>
        <AdminAccessLedger
          currentStage="authenticator"
          heading="Second checkpoint."
          description="Your credentials are accepted. Verify the current code before entering the admin console."
        />
      </div>
    </section>
  );
}
