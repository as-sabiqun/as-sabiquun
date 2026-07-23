"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "./actions";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);
  const error = state && "error" in state ? state.error : undefined;
  const message = state && "message" in state ? state.message : undefined;

  return (
    <section className="auth-shell">
      <div className="container flex justify-center">
        <div className="card auth-card">
          <p className="auth-eyebrow">Get started</p>
          <h1 className="display auth-title">Create an account</h1>
          <p className="auth-lead">Keep every Korban order and Wakaf contribution connected to your own record.</p>

          <form className="auth-form" action={action}>
            {error && <p className="auth-error">{error}</p>}
            {message && <p className="auth-message">{message}</p>}

            <label className="label">Full name
              <input className="input" type="text" name="name" required placeholder="Your full name" autoComplete="name" />
            </label>
            <label className="label">Email
              <input className="input" type="email" name="email" required placeholder="you@example.com" autoComplete="email" />
            </label>
            <label className="label">Password
              <input className="input" type="password" name="password" required minLength={8} placeholder="At least 8 characters" autoComplete="new-password" />
            </label>

            <button type="submit" className="btn" disabled={pending}>
              {pending ? "Creating account…" : "Create account"} <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
