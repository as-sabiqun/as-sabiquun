"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { login } from "./actions";

function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  return (
    <div className="card auth-card">
      <p className="auth-eyebrow">Welcome back</p>
      <h1 className="display auth-title">Log in</h1>
      <p className="auth-lead">Log in to continue an order, follow a Wakaf contribution, or check your record.</p>

      <form className="auth-form" action={action}>
        {state?.error && <p className="auth-error">{state.error}</p>}
        <input type="hidden" name="next" value={next} />

        <label className="label">Email
          <input className="input" type="email" name="email" required placeholder="you@example.com" autoComplete="email" />
        </label>
        <label className="label">Password
          <input className="input" type="password" name="password" required placeholder="••••••••" autoComplete="current-password" />
        </label>

        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Logging in…" : "Log in"} <span aria-hidden="true">→</span>
        </button>
      </form>

      <p className="auth-switch">
        New to As-Sābiqūn? <Link href="/signup">Create an account</Link>
      </p>
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
