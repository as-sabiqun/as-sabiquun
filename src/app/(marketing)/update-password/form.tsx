"use client";

import { ArrowLeft, ArrowRight, KeyRound } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { RecoveryLedger } from "../recovery-ledger";
import styles from "../recovery.module.css";
import { updatePassword } from "./actions";

export function UpdatePasswordForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(updatePassword.bind(null, next), undefined);
  const restartHref = { pathname: "/forgot-password", query: { context: "partner", next } };

  return (
    <section
      className={styles.shell}
      aria-labelledby="new-password-title"
      data-design-contract="THESIS: choosing a new password closes the same secure correspondence route begun by email. OWN-WORLD: paper dispatch sheet, ruled navy recovery ledger, cobalt action, green completion, editorial purpose and sans facts. STORY: the private link has been opened and the account owner now sets a unique password. FIRST VIEWPORT: new-password form left and completed recovery route right, with the action above the fold. FORM: secure correspondence ledger, grounded structure 4, seed c7113759, approved comp password-recovery-a-ledger. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md"
    >
      <div className={styles.frame}>
        <div className={styles.dispatchSheet}>
          <div className={styles.dispatchMark}><span aria-hidden="true"><KeyRound /></span><span>Secure password update</span></div>
          <h1 id="new-password-title">Choose a new password.</h1>
          <p className={styles.lead}>Use at least eight characters and choose a password you do not use for another account.</p>

          <form className={styles.form} action={action}>
            {state?.error && <p className={styles.error} role="alert">{state.error}</p>}
            <fieldset disabled={pending}>
              <label htmlFor="new-password">New password</label>
              <input className={styles.input} id="new-password" type="password" name="password" minLength={8} required autoComplete="new-password" />
              <label htmlFor="confirm-password">Confirm new password</label>
              <input className={styles.input} id="confirm-password" type="password" name="confirmation" minLength={8} required autoComplete="new-password" />
              <button type="submit" className={styles.primaryButton}>{pending ? "Updating password…" : <>Save new password <ArrowRight aria-hidden="true" /></>}</button>
            </fieldset>
          </form>

          <Link href={restartHref} className={styles.backLink}><ArrowLeft aria-hidden="true" /> Request a new recovery link</Link>
        </div>
        <RecoveryLedger currentStep={3} />
      </div>
    </section>
  );
}
