"use client";

import Link from "next/link";
import { useActionState } from "react";
import { adminLogin } from "./actions";

export function AdminSignInForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState(adminLogin, undefined);
  const error = state?.error ?? initialError;

  return (
    <div className="card auth-card">
      <p className="auth-arabic" lang="ar" dir="rtl">الأمانة</p>
      <p className="auth-eyebrow">Private operations</p>
      <h1 className="display auth-title">Administrator sign in</h1>
      <p className="auth-lead">Sign in with your administrator password. Authenticator checks resume on 22 August.</p>

      <form className="auth-form" action={action}>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <input type="hidden" name="next" value={next} />
        <label className="label">Administrator email
          <input className="input" type="email" name="email" required maxLength={254} autoComplete="username" />
        </label>
        <label className="label">Password
          <input className="input" type="password" name="password" required maxLength={1024} autoComplete="current-password" />
        </label>
        <Link href="/forgot-password?returnTo=/admin/sign-in" className="auth-forgot">Forgot password?</Link>
        <button type="submit" className="btn" disabled={pending}>{pending ? "Checking…" : "Continue securely"}</button>
      </form>
    </div>
  );
}
