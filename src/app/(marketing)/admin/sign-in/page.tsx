import { KeyRound, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveAdmin, getAdminMfaState } from "@/lib/auth";
import { safeAdminRedirectPath } from "@/lib/auth-redirect";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AdminAccessLedger } from "../admin-access-ledger";
import styles from "../admin-access.module.css";
import { AdminSignInForm } from "./form";

export const metadata: Metadata = {
  title: "Administrator sign in",
  robots: { index: false, follow: false },
};

export default async function AdminSignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const next = safeAdminRedirectPath(params.next);

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const admin = await getActiveAdmin(supabase);
    if (admin) {
      const mfaState = await getAdminMfaState(supabase);
      if (mfaState === "verified") redirect(next);
      if (mfaState === "challenge") redirect(`/admin/mfa/challenge?next=${encodeURIComponent(next)}`);
      if (mfaState === "enroll") redirect(`/admin/mfa/enroll?next=${encodeURIComponent(next)}`);
    }
  }

  return (
    <section
      className={styles.shell}
      aria-labelledby="admin-sign-in-title"
      data-design-contract="THESIS: administrator sign-in is the first checkpoint in a protected operations route, not a generic auth card. OWN-WORLD: manuscript ivory, white credential paper, deep operational teal, warm ink, rare gold current-state detail, admin display and sans facts. STORY: identify the admin boundary, enter assigned credentials, continue through authenticator verification, reach the requested console page. FIRST VIEWPORT: access ledger left, credential sheet right, sign-in action above the fold. FORM: operations access ledger, grounded candidate 5, seed 9c23affc. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md"
    >
      <div className={styles.frame}>
        <div className={styles.credentialSheet}>
          <div className={styles.formIntro}>
            <span className={styles.formIcon} aria-hidden="true"><KeyRound /></span>
            <div><h1 id="admin-sign-in-title">Administrator sign in.</h1><p>Use the email and password created for you.</p></div>
          </div>
          <AdminSignInForm next={next} initialError={params.error} />
          <p className={styles.mfaNote}><ShieldCheck aria-hidden="true" /> Valid credentials continue to authenticator verification when required.</p>
        </div>
        <AdminAccessLedger
          currentStage="credentials"
          heading="Restricted operations access."
          description="Administrator credentials are followed by authenticator verification before console access."
        />
      </div>
    </section>
  );
}
