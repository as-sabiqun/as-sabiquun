"use client";

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";
import styles from "../admin-access.module.css";
import { adminLogin } from "./actions";

export function AdminSignInForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState(adminLogin, undefined);
  const error = state?.error ?? initialError;

  return (
    <form className={styles.form} action={action}>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <input type="hidden" name="next" value={next} />
      <fieldset disabled={pending}>
        <label htmlFor="admin-email">Administrator email</label>
        <input className={styles.input} id="admin-email" type="email" name="email" required maxLength={254} autoComplete="username" placeholder="name@organisation.org" />
        <label htmlFor="admin-password">Password</label>
        <input className={styles.input} id="admin-password" type="password" name="password" required maxLength={1024} autoComplete="current-password" />
        <p className={styles.formHelp}>Forgot your password? Ask a team administrator to set a new one.</p>
        <button type="submit" className={styles.submitButton}>{pending ? "Signing in…" : <>Sign in <ArrowRight aria-hidden="true" /></>}</button>
      </fieldset>
    </form>
  );
}
