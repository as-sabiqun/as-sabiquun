"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { GoogleMark } from "@/components/google-mark";
import { login, loginWithGoogle } from "./actions";

function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const error = state?.error ?? searchParams.get("error");

  return (
    <div className="card auth-card">
      <p className="auth-arabic" lang="ar" dir="rtl">السَّابِقُونَ</p>
      <p className="auth-eyebrow">Welcome back</p>
      <h1 className="display auth-title">Your deeds, kept together.</h1>
      <p className="auth-lead">Continue an order, follow a Wakaf contribution, or review its fulfilment record.</p>

      <form action={loginWithGoogle} className="auth-google-form">
        <input type="hidden" name="next" value={next} />
        <button type="submit" className="auth-google"><GoogleMark /> Continue with Google</button>
      </form>

      <div className="auth-divider"><span>or use email</span></div>

      <form className="auth-form" action={action}>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <input type="hidden" name="next" value={next} />

        <label className="label">Email
          <input className="input" type="email" name="email" required placeholder="you@example.com" autoComplete="email" />
        </label>
        <label className="label">Password
          <input className="input" type="password" name="password" required placeholder="••••••••" autoComplete="current-password" />
        </label>

        <Link href="/forgot-password" className="auth-forgot">Forgot password?</Link>

        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Logging in…" : "Log in"} <span aria-hidden="true">→</span>
        </button>
      </form>

      <p className="auth-switch">
        New to As-Sābiqūn? <Link href="/signup">Create an account</Link>
      </p>

      <div className="auth-staff-note">
        <strong>Staff &amp; fulfilment partners</strong>
        <span>Use the assigned email and password above. Google access is for customer accounts.</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <section className="auth-shell">
      <div className="container flex justify-center">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
