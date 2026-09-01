import { ArrowLeft, MailWarning } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { safeVendorRedirectPath } from "@/lib/auth-redirect";
import { createClient, getProfile } from "@/lib/supabase/server";
import { RecoveryLedger } from "../recovery-ledger";
import styles from "../recovery.module.css";
import { UpdatePasswordForm } from "./form";

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ context?: string; next?: string }> }) {
  const params = await searchParams;
  const next = safeVendorRedirectPath(params.next);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const restartHref = { pathname: "/forgot-password", query: { context: "partner", next } };
    return (
      <section className={styles.shell} aria-labelledby="expired-recovery-title">
        <div className={styles.frame}>
          <div className={styles.dispatchSheet}>
            <div className={styles.dispatchMark}><span aria-hidden="true"><MailWarning /></span><span>Recovery link unavailable</span></div>
            <h1 id="expired-recovery-title">This recovery link is no longer active.</h1>
            <p className={styles.lead}>Recovery links are private and time-limited. Request another link to continue safely.</p>
            <Link href={restartHref} className={styles.primaryLink}>Request another recovery link</Link>
            <Link href="/partner-login" className={styles.backLink}><ArrowLeft aria-hidden="true" /> Back to partner sign in</Link>
          </div>
          <RecoveryLedger currentStep={1} />
        </div>
      </section>
    );
  }

  const profile = await getProfile(supabase, user.id);
  if (!profile || profile.role === "customer") redirect("/login");
  if (profile.role === "admin") redirect("/admin/sign-in?error=Ask a team administrator to set a new password.");
  return <UpdatePasswordForm next={next} />;
}
