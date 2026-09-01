"use client";

import { ArrowRight, BriefcaseBusiness, Check, ClipboardCheck, LockKeyhole, Upload } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState, useState } from "react";
import { partnerLogin } from "./actions";
import styles from "./partner-login.module.css";

const partnerFlow = [
  [BriefcaseBusiness, "Review the brief", "See the job requirements and delivery details in one place."],
  [ClipboardCheck, "Record the progress", "Keep each fulfilment stage clear and current."],
  [Upload, "Submit the evidence", "Send the required proof for administrator review."],
] as const;

function PartnerLoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [editedEmail, setEditedEmail] = useState<string | null>(null);
  const [state, action, pending] = useActionState(partnerLogin.bind(null, next), undefined);
  const error = state?.error ?? searchParams.get("error");
  const message = searchParams.get("message");
  const forgotPasswordHref = next ? { pathname: "/forgot-password", query: { context: "partner", next } } : { pathname: "/forgot-password", query: { context: "partner" } };

  return (
    <section
      className={styles.shell}
      aria-labelledby="partner-login-title"
      data-design-contract="THESIS: partner access is the operational handoff into assigned work, not a generic credential card. OWN-WORLD: cream access sheet, navy fulfilment brief, cobalt action, green reviewed states, editorial purpose and sans facts. STORY: invited partner confirms identity, enters the workspace, receives and documents work. FIRST VIEWPORT: focused sign-in left, three-stage fulfilment brief right, primary action above the fold. FORM: role-specific extension of the secure-access family. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md"
    >
      <div className={styles.frame}>
        <div className={styles.accessSheet}>
          <div className={styles.sheetHeader}>
            <span className={styles.sheetIcon} aria-hidden="true"><BriefcaseBusiness /></span>
            <div>
              <h1 id="partner-login-title">Continue to your partner workspace.</h1>
              <p>Use the credentials linked to your approved As-Sabiquun partner profile.</p>
            </div>
          </div>

          <form className={styles.form} action={action}>
            {error && <p className={styles.error} role="alert">{error}</p>}
            {!error && message && <p className={styles.message} role="status"><Check aria-hidden="true" /> {message}</p>}
            <fieldset disabled={pending}>
              <label htmlFor="partner-email">Partner email</label>
              <input className={styles.input} id="partner-email" type="email" name="email" required maxLength={254} autoComplete="email" placeholder="name@partner.org" value={editedEmail ?? state?.email ?? ""} onChange={(event) => setEditedEmail(event.target.value)} />

              <div className={styles.passwordLabel}>
                <label htmlFor="partner-password">Password</label>
                <Link href={forgotPasswordHref}>Forgot password?</Link>
              </div>
              <input className={styles.input} id="partner-password" type="password" name="password" required maxLength={1024} autoComplete="current-password" />

              <button type="submit" className={styles.primaryButton}>
                {pending ? "Signing in…" : <>Open partner workspace <ArrowRight aria-hidden="true" /></>}
              </button>
            </fieldset>
          </form>

          <p className={styles.securityNote}><LockKeyhole aria-hidden="true" /> Partner access is limited to invited, approved accounts.</p>

          <div className={styles.customerNote}>
            <span>Managing your own service or contribution?</span>
            <Link href="/login">Use customer sign-in <ArrowRight aria-hidden="true" /></Link>
          </div>
        </div>

        <aside className={styles.handoffPanel} aria-label="Partner fulfilment workflow">
          <div className={styles.panelMark} aria-hidden="true">
            <span><LockKeyhole /></span><i /><span>Fulfilment access</span>
          </div>

          <div>
            <h2>The job begins with a clear brief.</h2>
            <p>Everything needed to understand, carry out, and document assigned work stays connected to the same operational record.</p>
          </div>

          <ol className={styles.partnerFlow}>
            {partnerFlow.map(([Icon, title, copy], index) => (
              <li key={title}>
                <span className={styles.flowNumber}>{String(index + 1).padStart(2, "0")}</span>
                <Icon aria-hidden="true" />
                <span><strong>{title}</strong><small>{copy}</small></span>
              </li>
            ))}
          </ol>

          <p className={styles.panelNote}><Check aria-hidden="true" /> Submitted evidence moves to administrator review before the customer record is completed.</p>
        </aside>
      </div>
    </section>
  );
}

export default function PartnerLoginPage() {
  return <Suspense fallback={<div className={styles.loading} aria-hidden="true" />}><PartnerLoginForm /></Suspense>;
}
