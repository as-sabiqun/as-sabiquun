"use client";

import { useActionState } from "react";
import { adminLogin } from "./actions";

export function AdminSignInForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState(adminLogin, undefined);
  const error = state?.error ?? initialError;

  return (
    <div className="card auth-card">
      <p className="auth-arabic" lang="ar" dir="rtl">الأمانة</p>
      <h1 className="display auth-title">Administrator sign in</h1>
      <p className="auth-lead">Use the email and password created for you.</p>

      <form className="auth-form" action={action}>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <input type="hidden" name="next" value={next} />
        <label className="label">Administrator email
          <input className="input" type="email" name="email" required maxLength={254} autoComplete="username" />
        </label>
        <label className="label">Password
          <input className="input" type="password" name="password" required maxLength={1024} autoComplete="current-password" />
        </label>
        <p className="auth-form-help">Forgot your password? Ask a team administrator to set a new one.</p>
        <button type="submit" className="btn" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
