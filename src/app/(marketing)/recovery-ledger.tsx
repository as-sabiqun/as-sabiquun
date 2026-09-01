import { Check, KeyRound, MailCheck, Send } from "lucide-react";
import styles from "./recovery.module.css";

const recoverySteps = [
  [Send, "Request a secure link", "Enter the email connected to the account."],
  [MailCheck, "Open the recovery email", "Follow the private link sent by As-Sabiquun."],
  [KeyRound, "Choose a new password", "Set a unique password with at least eight characters."],
] as const;

export function RecoveryLedger({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <aside className={styles.ledger} aria-label="Password recovery steps">
      <div className={styles.ledgerMark}>
        <span>Secure correspondence</span>
        <i aria-hidden="true" />
        <span>Account recovery</span>
      </div>
      <div className={styles.ledgerIntro}>
        <h2>A short route back to your account.</h2>
        <p>Each link is private, time-limited, and intended only for the email address that requested it.</p>
      </div>
      <ol className={styles.steps}>
        {recoverySteps.map(([Icon, title, copy], index) => {
          const step = (index + 1) as 1 | 2 | 3;
          const state = step < currentStep ? "complete" : step === currentStep ? "current" : "upcoming";
          return (
            <li key={title} data-state={state}>
              <span className={styles.stepNumber}>{String(step).padStart(2, "0")}</span>
              <Icon aria-hidden="true" />
              <span className={styles.stepCopy}><strong>{title}</strong><small>{copy}</small></span>
              <span className={styles.stepState}>{state === "complete" ? <><Check aria-hidden="true" /> Complete</> : state === "current" ? "Current" : "Next"}</span>
            </li>
          );
        })}
      </ol>
      <p className={styles.ledgerNote}>If you did not request a recovery link, you can ignore the email. Your account will remain unchanged.</p>
    </aside>
  );
}
