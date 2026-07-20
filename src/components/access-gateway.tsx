"use client";

import Link from "next/link";
import { type FormEvent, useId, useState } from "react";
import { LoginForm } from "@/components/auth-form";
import { Brand } from "@/components/brand";

type Role = "vendor" | "customer";

const roles = {
  vendor: {
    label: "Vendor",
    description: "Manage assigned work and submit fulfilment proof.",
    eyebrow: "Partner access",
    title: "Continue as a vendor.",
    guidance: "Vendor access is invite-only. Use the business email invited by As-Sābiqūn.",
    destination: "/vendor-dashboard",
    demoLabel: "Open vendor dashboard demo",
  },
  customer: {
    label: "Customer",
    description: "Follow your services, receipts, and completed proof.",
    eyebrow: "Customer access",
    title: "Continue as a customer.",
    guidance: "Use the same email attached to your service order.",
    destination: "/dashboard",
    demoLabel: "Open customer dashboard demo",
  },
} as const;

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.19-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.86A6.02 6.02 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z" />
    </svg>
  );
}

export function AccessGateway({ configured, demoEnabled, initialRole = "vendor", notice }: { configured: boolean; demoEnabled: boolean; initialRole?: Role; notice?: string }) {
  const [role, setRole] = useState<Role>(initialRole);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const emailId = useId();
  const codeId = useId();
  const selected = roles[role];

  function chooseRole(nextRole: Role) {
    setRole(nextRole);
    setStep("email");
    setEmail("");
  }

  function showCodeForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep("code");
  }

  function openDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.assign(`/onboarding?role=${role}`);
  }

  return (
    <main className="access-gateway min-h-screen bg-[var(--cream)] lg:grid lg:grid-cols-[minmax(320px,0.82fr)_minmax(520px,1.18fr)]">
      <section className="access-story relative isolate hidden min-h-screen overflow-hidden bg-[var(--ink)] px-10 py-12 text-white lg:flex lg:flex-col xl:px-16 xl:py-14">
        <div aria-hidden="true" className="absolute -right-40 -top-36 -z-10 h-[34rem] w-[34rem] rounded-full border border-white/10" />
        <div aria-hidden="true" className="absolute -right-20 -top-16 -z-10 h-[24rem] w-[24rem] rounded-full border border-[var(--gold)]/30" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.13)_1px,transparent_0)] bg-[size:24px_24px] [mask-image:linear-gradient(to_top,black,transparent)]" />

        <Brand inverse />

        <div className="my-auto max-w-lg py-20">
          <p className="text-[.68rem] font-extrabold uppercase tracking-[.18em] text-[var(--gold)]">Your service, clearly accounted for</p>
          <h1 className="display mt-6 text-[clamp(3.25rem,5.2vw,5.8rem)] leading-[.92] text-white">One trusted entrance.</h1>
          <p className="mt-8 max-w-md text-base leading-8 text-white/65">
            Sign in once. We confirm your account and take you to the workspace that belongs to you.
          </p>

          <ol className="mt-14 grid gap-5 border-l border-white/15 pl-6">
            {[
              ["01", "Choose your account type"],
              ["02", "Confirm your invited email"],
              ["03", "Continue to your workspace"],
            ].map(([number, label]) => (
              <li key={number} className="flex items-center gap-4 text-sm text-white/70">
                <span className="numeral grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 text-[.62rem] text-white">{number}</span>
                {label}
              </li>
            ))}
          </ol>
        </div>

        <p className="max-w-sm text-xs leading-6 text-white/45">Access is checked after sign-in. Choosing a workspace here never changes account permissions.</p>
      </section>

      <section className="access-panel flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12 xl:px-20">
        <div className="w-full max-w-[34rem]">
          <div className="mb-9 flex items-center justify-between gap-5 lg:hidden">
            <Brand compact />
            <Link href="/" className="text-xs font-bold text-[var(--teal)]">Return home</Link>
          </div>

          <p className="eyebrow">Account access</p>
          <h2 className="display mt-4 text-4xl leading-none text-[var(--ink)] sm:text-5xl">Choose your workspace.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">Select who you are, then use the single sign-in form below.</p>

          <fieldset className="access-role-selector mt-8 grid gap-3">
            <legend className="sr-only">Choose account type</legend>
            {(Object.keys(roles) as Role[]).map((option, index) => {
              const item = roles[option];
              const active = role === option;
              return (
                <label
                  key={option}
                  className={`access-role-option group flex min-h-[88px] cursor-pointer items-center gap-4 rounded-2xl border bg-white p-4 transition-[border-color,box-shadow,transform] hover:-translate-y-px focus-within:ring-2 focus-within:ring-[var(--gold)] focus-within:ring-offset-2 ${active ? "border-[var(--teal)] shadow-[0_12px_35px_rgba(29,115,127,.10)]" : "border-[var(--line)] hover:border-[rgba(29,115,127,.4)]"}`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="account-type"
                    value={option}
                    checked={active}
                    onChange={() => chooseRole(option)}
                  />
                  <span className={`numeral grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[.68rem] ${active ? "bg-[var(--teal)] text-white" : "bg-[var(--teal-soft)] text-[var(--teal)]"}`}>0{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm text-[var(--ink)]">{item.label}</strong>
                    <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{item.description}</span>
                  </span>
                  <span aria-hidden="true" className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${active ? "border-[var(--teal)]" : "border-[var(--line)]"}`}>
                    <span className={`h-2.5 w-2.5 rounded-full bg-[var(--teal)] transition-opacity ${active ? "opacity-100" : "opacity-0"}`} />
                  </span>
                </label>
              );
            })}
          </fieldset>

          <section className="access-form mt-5 rounded-[1.4rem] border border-[var(--line)] bg-white p-5 shadow-[0_24px_70px_rgba(49,35,27,.07)] sm:p-7" aria-labelledby="access-form-heading">
            {notice && <p className="mb-5 rounded-xl border border-[rgba(123,47,38,.16)] bg-[#f8efed] p-3 text-xs leading-5 text-[#7b2f26]" role="alert">{notice}</p>}
            <p className="text-[.65rem] font-extrabold uppercase tracking-[.15em] text-[var(--teal)]">{selected.eyebrow}</p>
            <h3 id="access-form-heading" className="display mt-2 text-2xl text-[var(--ink)]">{selected.title}</h3>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{selected.guidance}</p>

            {configured ? (
              <div className="mt-6">
                <div className="mb-5 rounded-xl border border-[rgba(162,124,71,.24)] bg-[#faf7f1] p-3 text-xs leading-5 text-[var(--muted)]">
                  Secure password access is active. Google and email-code sign-in will appear after their providers are configured.
                </div>
                <LoginForm />
              </div>
            ) : demoEnabled ? (
              <>
                {role === "customer" && step === "email" && (
                  <>
                    <button
                      type="button"
                      disabled
                      aria-describedby="google-setup-note"
                      className="access-google mt-6 flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold text-[var(--ink)] opacity-60"
                    >
                      <GoogleMark />
                      Continue with Google
                    </button>
                    <p id="google-setup-note" className="mt-2 text-center text-[.68rem] text-[var(--muted)]">Available when authentication is connected</p>
                    <div className="my-5 flex items-center gap-3 text-[.62rem] font-bold uppercase tracking-[.12em] text-[var(--muted)]">
                      <span className="h-px flex-1 bg-[var(--line)]" /> or use email <span className="h-px flex-1 bg-[var(--line)]" />
                    </div>
                  </>
                )}

                {step === "email" ? (
                  <form className={role === "vendor" ? "mt-6 grid gap-4" : "grid gap-4"} onSubmit={showCodeForm}>
                    <label htmlFor={emailId} className="label">
                      {role === "vendor" ? "Invited business email" : "Email address"}
                    </label>
                    <input
                      id={emailId}
                      className="input"
                      type="email"
                      autoComplete="email"
                      placeholder={role === "vendor" ? "team@organisation.org" : "you@example.com"}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                    <button className="btn mt-1 w-full" type="submit">Send a 6-digit code</button>
                  </form>
                ) : (
                  <form className="access-code-state mt-6 grid gap-4" onSubmit={openDemo}>
                    <div role="status" className="rounded-xl bg-[var(--teal-soft)] p-4 text-xs leading-5 text-[var(--teal)]">
                      Check <strong>{email}</strong> for your six-digit code.
                    </div>
                    <label htmlFor={codeId} className="label">Six-digit code</label>
                    <input
                      id={codeId}
                      className="input text-center text-lg tracking-[.4em]"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="000000"
                      required
                      autoFocus
                    />
                    <p className="text-[.68rem] leading-5 text-[var(--muted)]">Demo mode: enter any six digits to preview the workspace.</p>
                    <button className="btn w-full" type="submit">Continue to {role === "vendor" ? "vendor" : "customer"} demo</button>
                    <button className="min-h-11 text-sm font-bold text-[var(--teal)]" type="button" onClick={() => setStep("email")}>Use a different email</button>
                  </form>
                )}

                <div className="mt-5 border-t border-[var(--line)] pt-5 text-center">
                  <Link className="access-demo-link text-xs font-bold text-[var(--teal)] hover:text-[var(--ink)]" href={selected.destination}>
                    {selected.demoLabel} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-xl border border-[rgba(162,124,71,.24)] bg-[#faf7f1] p-4 text-sm leading-7 text-[var(--muted)]">
                <strong className="block text-[var(--ink)]">Portal access is not active yet.</strong>
                Authentication and public preview access are both disabled in this environment. Please contact the As-Sābiqūn team if you need account access.
              </div>
            )}
          </section>

          <p className="mt-6 text-center text-[.7rem] leading-5 text-[var(--muted)]">Your selected workspace is confirmed against your account after sign-in.</p>
          <Link href="/" className="mt-5 hidden text-center text-xs font-bold text-[var(--teal)] lg:block">← Return to website</Link>
        </div>
      </section>
    </main>
  );
}
