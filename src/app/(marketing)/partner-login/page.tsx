"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { partnerLogin } from "./actions";

function PartnerLoginForm() {
  const [state, action, pending] = useActionState(partnerLogin, undefined);
  const searchParams = useSearchParams();
  const error = state?.error ?? searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <div className="card auth-card">
      <p className="auth-arabic" lang="ar" dir="rtl">أمانة</p>
      <p className="auth-eyebrow">Fulfilment partner</p>
      <h1 className="display auth-title">Partner sign in</h1>
      <p className="auth-lead">Use the email address from your As-Sabiquun invitation.</p>

      <form className="auth-form" action={action}>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
        <input type="hidden" name="next" value={searchParams.get("next") ?? ""} />
        <label className="label">Partner email
          <input className="input" type="email" name="email" required maxLength={254} autoComplete="email" placeholder="ops@partner.example" />
        </label>
        <label className="label">Password
          <input className="input" type="password" name="password" required maxLength={1024} autoComplete="current-password" />
        </label>
        <Link href="/forgot-password" className="auth-forgot">Forgot password?</Link>
        <button type="submit" className="btn" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      </form>

      <p className="auth-switch">Customer? <Link href="/login">Continue with Google</Link></p>
    </div>
  );
}

export default function PartnerLoginPage() {
  return (
    <section className="auth-shell">
      <div className="container flex justify-center">
        <Suspense fallback={null}><PartnerLoginForm /></Suspense>
      </div>
    </section>
  );
}
