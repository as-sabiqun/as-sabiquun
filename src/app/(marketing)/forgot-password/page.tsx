"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <section className="auth-shell">
      <div className="container flex justify-center">
        <div className="card auth-card">
          <p className="auth-arabic" lang="ar" dir="rtl">السَّابِقُونَ</p>
          <p className="auth-eyebrow">Account recovery</p>
          <h1 className="display auth-title">Reset your password</h1>
          <p className="auth-lead">We will email you a secure link to choose a new password.</p>

          <form className="auth-form" action={action}>
            {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
            {state?.message && <p className="auth-message" role="status">{state.message}</p>}
            <label className="label">Email
              <input className="input" type="email" name="email" required autoComplete="email" placeholder="you@example.com" />
            </label>
            <button type="submit" className="btn" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</button>
          </form>

          <p className="auth-switch"><Link href="/login">Back to login</Link></p>
        </div>
      </div>
    </section>
  );
}
