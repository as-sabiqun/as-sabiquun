"use client";

import { ArrowRight, Check, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GoogleMark } from "@/components/google-mark";
import styles from "./login.module.css";

const recordTrail = [
  ["Order", "Return to the service details you confirmed."],
  ["Progress", "Follow the work as it moves towards completion."],
  ["Report", "Keep the final evidence with the original record."],
] as const;

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const error = searchParams.get("error");
  const sent = searchParams.get("sent") === "otp";
  const partnerHref = next ? { pathname: "/partner-login", query: { next } } : "/partner-login";
  const changeEmailHref = next ? { pathname: "/login", query: { next } } : "/login";

  return (
    <section
      className={styles.shell}
      aria-labelledby="customer-login-title"
      data-design-contract="THESIS: customer access is the return to a living service record, not a generic login card. OWN-WORLD: navy record cover, cream paper, cobalt action, green verification, editorial purpose and sans facts. STORY: remember what the account preserves, choose passwordless access, return to the record. FIRST VIEWPORT: dark record cover left, focused access sheet right, primary action above the fold. FORM: protected record cover, grounded candidate 3, seed 09e3d75e. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md"
    >
      <div className={styles.frame}>
        <div className={styles.recordCover}>
          <div>
            <div className={styles.coverMark} aria-hidden="true">
              <span><LockKeyhole /></span><i /><span>Private customer record</span>
            </div>
            <h1 id="customer-login-title" className={styles.title}>Come back to the work you entrusted.</h1>
            <p className={styles.intro}>Your account keeps the service, its progress, and the proof of completion in one continuous record.</p>
          </div>

          <ol className={styles.recordTrail} aria-label="What your customer account keeps together">
            {recordTrail.map(([label, copy], index) => (
              <li key={label}>
                <span className={styles.trailNumber}>{String(index + 1).padStart(2, "0")}</span>
                <span><strong>{label}</strong><small>{copy}</small></span>
                <Check aria-hidden="true" />
              </li>
            ))}
          </ol>

          <div className={styles.passwordlessNote}>
            <LockKeyhole aria-hidden="true" />
            <span><strong>Passwordless customer access</strong><small>We send a private sign-in code to your email.</small></span>
          </div>
        </div>

        <div className={styles.accessSheet}>
          <div className={styles.sheetHeader}>
            <span className={styles.sheetIcon} aria-hidden="true"><Mail /></span>
            <div>
              <h2>{sent ? "Enter your sign-in code" : "Open your customer record"}</h2>
              <p>{sent ? "We sent a six-digit code to the email you entered." : "Use the same email you used for your service."}</p>
            </div>
          </div>

          {error && <p className={styles.error} role="alert">{error}</p>}

          {sent ? (
            <form action="/auth/email/verify" method="post" className={styles.form}>
              <label htmlFor="customer-token">Six-digit sign-in code</label>
              <input className={`${styles.input} ${styles.codeInput}`} id="customer-token" type="text" name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus placeholder="000000" aria-describedby="code-help" />
              <p className={styles.fieldHelp} id="code-help">Enter the code exactly as it appears in your email.</p>
              <button type="submit" className={styles.primaryButton}>Continue to my record <ArrowRight aria-hidden="true" /></button>
              <Link className={styles.changeEmail} href={changeEmailHref}>Use a different email</Link>
            </form>
          ) : (
            <>
              <form action="/auth/email" method="post" className={styles.form}>
                <input type="hidden" name="next" value={next} />
                <label htmlFor="customer-email">Email address</label>
                <input className={styles.input} id="customer-email" type="email" name="email" autoComplete="email" required placeholder="you@example.com" />
                <button type="submit" className={styles.primaryButton}>Email me a sign-in code <ArrowRight aria-hidden="true" /></button>
              </form>

              <div className={styles.divider}><span>or continue with</span></div>

              <form action="/auth/google" method="get">
                <input type="hidden" name="next" value={next} />
                <button type="submit" className={styles.googleButton}><GoogleMark /> Google</button>
              </form>
            </>
          )}

          <p className={styles.assurance}><LockKeyhole aria-hidden="true" /> Your account details stay private and are used only to give you access to your records.</p>

          <div className={styles.partnerNote}>
            <span>Completing services for As-Sabiquun?</span>
            <Link href={partnerHref}>Use the partner sign-in <ArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className={styles.loading} aria-hidden="true" />}><LoginForm /></Suspense>;
}
