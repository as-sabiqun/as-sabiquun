"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { updatePassword } from "./actions";

export default function UpdatePasswordPage() {
  const searchParams = useSearchParams();
  const [state, action, pending] = useActionState(updatePassword.bind(null, searchParams.get("next") ?? ""), undefined);

  return (
    <section className="auth-shell">
      <div className="container flex justify-center">
        <div className="card auth-card">
          <p className="auth-arabic" lang="ar" dir="rtl">السَّابِقُونَ</p>
          <p className="auth-eyebrow">Account recovery</p>
          <h1 className="display auth-title">Choose a new password</h1>
          <p className="auth-lead">Use at least eight characters and keep it unique to this account.</p>

          <form className="auth-form" action={action}>
            {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
            <label className="label">New password
              <input className="input" type="password" name="password" minLength={8} required autoComplete="new-password" />
            </label>
            <label className="label">Confirm password
              <input className="input" type="password" name="confirmation" minLength={8} required autoComplete="new-password" />
            </label>
            <button type="submit" className="btn" disabled={pending}>{pending ? "Updating…" : "Update password"}</button>
          </form>
        </div>
      </div>
    </section>
  );
}
