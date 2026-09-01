"use client";

import { ArrowRight, LogOut, QrCode } from "lucide-react";
import Image from "next/image";
import { useActionState, useEffect, useRef } from "react";
import styles from "../admin-access.module.css";
import { beginMfaEnrollment, switchAdminAccount, verifyMfaChallenge, verifyMfaEnrollment } from "./actions";

function CodeField({ id, errorId }: { id: string; errorId?: string }) {
  const describedBy = errorId ? `${id}-hint ${errorId}` : `${id}-hint`;
  return (
    <div className={styles.codeField}>
      <label htmlFor={id}>Six-digit code</label>
      <input className={`${styles.input} ${styles.codeInput}`} id={id} name="code" required inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="one-time-code" placeholder="000000" aria-invalid={Boolean(errorId)} aria-describedby={describedBy} />
      <p id={`${id}-hint`}>Enter the six digits currently shown in your app.</p>
    </div>
  );
}

function EnrollmentVerification({ factorId, next }: { factorId: string; next: string }) {
  const [state, action, pending] = useActionState(verifyMfaEnrollment, undefined);
  const errorId = state?.error ? "admin-enrollment-error" : undefined;
  return (
    <form className={styles.form} action={action}>
      {state?.error && <p className={styles.error} id={errorId} role="alert">{state.error}</p>}
      <p className={styles.srOnly} role="status" aria-live="polite">{pending ? "Verifying authenticator code." : ""}</p>
      <fieldset disabled={pending}>
        <input type="hidden" name="factorId" value={factorId} />
        <input type="hidden" name="next" value={next} />
        <CodeField id="admin-enrollment-code" errorId={errorId} />
        <button type="submit" className={styles.submitButton}>{pending ? "Verifying…" : <>Enable authenticator <ArrowRight aria-hidden="true" /></>}</button>
      </fieldset>
    </form>
  );
}

export function MfaEnrollmentForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(beginMfaEnrollment, undefined);

  if (!state?.enrollment) {
    return (
      <form className={`${styles.form} ${styles.setupLaunch}`} action={action}>
        {state?.error && <p className={styles.error} role="alert">{state.error}</p>}
        <p className={styles.srOnly} role="status" aria-live="polite">{pending ? "Preparing authenticator setup." : ""}</p>
        <fieldset disabled={pending}>
          <div className={styles.setupSummary}>
            <QrCode aria-hidden="true" />
            <div><strong>A QR code will appear here.</strong><p>Open your authenticator app before continuing. You can also enter a setup key manually.</p></div>
          </div>
          <button type="submit" className={styles.submitButton}>{pending ? "Preparing secure setup…" : <>Create setup code <ArrowRight aria-hidden="true" /></>}</button>
        </fieldset>
      </form>
    );
  }

  return <MfaEnrollmentSetup enrollment={state.enrollment} next={next} />;
}

export function MfaEnrollmentSetup({ enrollment, next }: { enrollment: { factorId: string; qrCode: string; secret: string }; next: string }) {
  const setupHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setupHeadingRef.current?.focus();
  }, []);

  return (
    <div className={styles.enrollmentSetup}>
      <div className={styles.qrPanel}>
        <h2 className={styles.setupStep} ref={setupHeadingRef} tabIndex={-1}>Scan with your authenticator app</h2>
        <div className={styles.qrCode}>
          <Image src={enrollment.qrCode} width={220} height={220} unoptimized alt="QR code for the As-Sabiquun administrator authenticator" />
        </div>
      </div>
      <div className={styles.manualKey}>
        <strong>Cannot scan the code?</strong>
        <p>Enter this setup key manually in your authenticator app.</p>
        <code>{enrollment.secret}</code>
        <small>Treat this key like a password. Do not share it or store it in an unsecured place.</small>
      </div>
      <EnrollmentVerification factorId={enrollment.factorId} next={next} />
    </div>
  );
}

export function MfaChallengeForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(verifyMfaChallenge, undefined);
  const errorId = state?.error ? "admin-challenge-error" : undefined;
  return (
    <form className={styles.form} action={action}>
      {state?.error && <p className={styles.error} id={errorId} role="alert">{state.error}</p>}
      <p className={styles.srOnly} role="status" aria-live="polite">{pending ? "Verifying administrator access." : ""}</p>
      <fieldset disabled={pending}>
        <input type="hidden" name="next" value={next} />
        <CodeField id="admin-challenge-code" errorId={errorId} />
        <button type="submit" className={styles.submitButton}>{pending ? "Verifying…" : <>Verify and continue <ArrowRight aria-hidden="true" /></>}</button>
      </fieldset>
    </form>
  );
}

export function MfaAccountEscape({ next }: { next: string }) {
  return (
    <div className={styles.accountEscape}>
      <p>No access to this authenticator? Contact the person who manages administrator access for this deployment.</p>
      <form action={switchAdminAccount}>
        <input type="hidden" name="next" value={next} />
        <button type="submit" className={styles.secondaryButton}><LogOut aria-hidden="true" /> Use another administrator</button>
      </form>
    </div>
  );
}
