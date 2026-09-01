"use client";

import { ArrowLeft, ArrowRight, Check, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { RecoveryLedger } from "../recovery-ledger";
import styles from "../recovery.module.css";
import { requestPasswordReset } from "./actions";

export function ForgotPasswordForm({ next }: { next: string }) {
  const [editedEmail, setEditedEmail] = useState<string | null>(null);
  const [state, action, pending] = useActionState(requestPasswordReset.bind(null, "partner", next), undefined);
  const backHref = next ? { pathname: "/partner-login", query: { next } } : "/partner-login";
  const sent = Boolean(state?.message);

  return (
    <section
      className={styles.shell}
      aria-labelledby="recovery-title"
      data-design-contract="THESIS: password recovery is a secure correspondence route, not a generic auth card. OWN-WORLD: paper dispatch sheet, ruled navy recovery ledger, cobalt action, green completion, editorial purpose and sans facts. STORY: request the private link, open the email, choose a new password. FIRST VIEWPORT: recovery form left and three-stage ledger right, with the action above the fold. FORM: secure correspondence ledger, grounded structure 4, seed c7113759, approved comp password-recovery-a-ledger. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md"
    >
      <div className={styles.frame}>
        <div className={styles.dispatchSheet}>
          <div className={styles.dispatchMark}><span aria-hidden="true"><Mail /></span><span>Private recovery request</span></div>
          <h1 id="recovery-title">Recover partner access.</h1>
          <p className={styles.lead}>Enter the email connected to your partner account. We’ll send a private link that lets you choose a new password.</p>

          <form className={styles.form} action={action}>
            {state?.error && <p className={styles.error} role="alert">{state.error}</p>}
            {!state?.error && state?.message && <p className={styles.message} role="status"><Check aria-hidden="true" /> {state.message}</p>}
            <fieldset disabled={pending}>
              <label htmlFor="recovery-email">Partner email address</label>
              <input className={styles.input} id="recovery-email" type="email" name="email" required maxLength={254} autoComplete="email" placeholder="name@partner.org" value={editedEmail ?? state?.email ?? ""} onChange={(event) => setEditedEmail(event.target.value)} />
              <button type="submit" className={styles.primaryButton}>{pending ? "Sending secure link…" : <>Send recovery link <ArrowRight aria-hidden="true" /></>}</button>
            </fieldset>
          </form>

          <Link href={backHref} className={styles.backLink}><ArrowLeft aria-hidden="true" /> Back to partner sign in</Link>
        </div>
        <RecoveryLedger currentStep={sent ? 2 : 1} />
      </div>
    </section>
  );
}
