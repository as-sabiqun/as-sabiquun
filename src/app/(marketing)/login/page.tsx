"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GoogleMark } from "@/components/google-mark";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const error = searchParams.get("error");
  const sent = searchParams.get("sent");
  const partnerHref = next ? { pathname: "/partner-login", query: { next } } : "/partner-login";

  return (
    <div className="card auth-card">
      <p className="auth-arabic" lang="ar" dir="rtl">السَّابِقُونَ</p>
      <p className="auth-eyebrow">Customer access</p>
      <h1 className="display auth-title">Your deeds, kept together.</h1>
      <p className="auth-lead">Continue an order, follow a Wakaf project, or view its completion record.</p>

      {error && <p className="auth-error" role="alert">{error}</p>}
      {sent === "email" && <p className="auth-message" role="status">Check your email for a one-time sign-in link.</p>}

      <form action="/auth/email" method="post" className="auth-form">
        <input type="hidden" name="next" value={next} />
        <label className="label">Email address
          <input className="input" type="email" name="email" autoComplete="email" required placeholder="you@example.com" />
        </label>
        <button type="submit" className="btn">Email me a sign-in link</button>
      </form>

      <div className="auth-divider"><span>or</span></div>

      <form action="/auth/google" method="get" className="auth-google-form">
        <input type="hidden" name="next" value={next} />
        <button type="submit" className="auth-google"><GoogleMark /> Continue with Google</button>
      </form>

      <div className="auth-staff-note">
        <strong>Fulfilment partner?</strong>
        <span><Link href={partnerHref}>Use your invited partner account</Link>. Customers can use email or Google.</span>
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
