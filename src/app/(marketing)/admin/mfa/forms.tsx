"use client";

import Image from "next/image";
import { useActionState } from "react";
import { beginMfaEnrollment, verifyMfaChallenge, verifyMfaEnrollment } from "./actions";

function CodeField() {
  return (
    <label className="label">Six-digit code
      <input className="input" name="code" required inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="one-time-code" placeholder="000000" />
    </label>
  );
}

function EnrollmentVerification({ factorId, next }: { factorId: string; next: string }) {
  const [state, action, pending] = useActionState(verifyMfaEnrollment, undefined);
  return (
    <form className="auth-form" action={action}>
      {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
      <input type="hidden" name="factorId" value={factorId} />
      <input type="hidden" name="next" value={next} />
      <CodeField />
      <button type="submit" className="btn" disabled={pending}>{pending ? "Verifying…" : "Enable authenticator"}</button>
    </form>
  );
}

export function MfaEnrollmentForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(beginMfaEnrollment, undefined);

  if (!state?.enrollment) {
    return (
      <form className="auth-form" action={action}>
        {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
        <button type="submit" className="btn" disabled={pending}>{pending ? "Preparing…" : "Set up authenticator"}</button>
      </form>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex justify-center">
        <Image src={state.enrollment.qrCode} width={220} height={220} unoptimized alt="QR code for the As-Sabiquun administrator authenticator" />
      </div>
      <div>
        <span className="label">Cannot scan it?</span>
        <p className="auth-lead">Enter this setup key manually:</p>
        <code className="block break-all text-sm">{state.enrollment.secret}</code>
      </div>
      <EnrollmentVerification factorId={state.enrollment.factorId} next={next} />
    </div>
  );
}

export function MfaChallengeForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(verifyMfaChallenge, undefined);
  return (
    <form className="auth-form" action={action}>
      {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
      <input type="hidden" name="next" value={next} />
      <CodeField />
      <button type="submit" className="btn" disabled={pending}>{pending ? "Verifying…" : "Verify and continue"}</button>
    </form>
  );
}
