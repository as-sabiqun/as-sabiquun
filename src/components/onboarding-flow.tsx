"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { logout } from "@/app/actions";
import { Brand } from "@/components/brand";

type OnboardingRole = "vendor" | "customer";

const copy = {
  vendor: {
    eyebrow: "Vendor onboarding",
    title: "Set up your fulfilment profile.",
    intro: "Share only the details our operations team needs to assign and support your work.",
    destination: "/vendor-dashboard",
    finish: "Profile sent for review",
    finishBody: "A new vendor remains pending until the As-Sābiqūn team approves the organisation and service coverage.",
  },
  customer: {
    eyebrow: "Customer onboarding",
    title: "Complete your account.",
    intro: "Confirm the contact details used for service updates, receipts, and verified proof.",
    destination: "/dashboard",
    finish: "Your account is ready",
    finishBody: "You can now follow active services and receive approved proof in one place.",
  },
} as const;

export function OnboardingFlow({ role }: { role: OnboardingRole }) {
  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    country: "Singapore",
    organisation: "",
    coverage: "",
    regions: "",
    updates: "Email",
    proofNotifications: true,
  });
  const selected = copy[role];

  function continueForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep((current) => Math.min(current + 1, 3));
  }

  function finish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCompleted(true);
  }

  return (
    <main className="onboarding-shell min-h-screen bg-[var(--cream)]">
      <header className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex min-h-[74px] max-w-[1180px] items-center justify-between gap-5 px-5 md:px-8">
          <Brand compact />
          <form action={logout}><button className="cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-[var(--teal)]" type="submit">Save and exit</button></form>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1180px] items-start gap-10 px-5 py-9 md:px-8 lg:grid-cols-[280px_minmax(0,620px)] lg:justify-between lg:py-16">
        <aside className="lg:sticky lg:top-10">
          <p className="eyebrow">{selected.eyebrow}</p>
          <h1 className="display mt-5 text-[clamp(2.6rem,5vw,4.3rem)] leading-[.94]">{completed ? selected.finish : selected.title}</h1>
          <p className="mt-5 text-sm leading-7 text-[var(--muted)]">{completed ? selected.finishBody : selected.intro}</p>

          {!completed && (
            <ol className="onboarding-progress mt-9 grid gap-2" aria-label="Onboarding progress">
              {["Your details", role === "vendor" ? "Organisation" : "Preferences", "Review"].map((label, index) => {
                const number = index + 1;
                const current = number === step;
                const done = number < step;
                return <li className={`${current ? "is-current" : ""} ${done ? "is-complete" : ""}`} aria-current={current ? "step" : undefined} key={label}><span>{done ? "✓" : number}</span><div><strong>{label}</strong><small>{done ? "Complete" : current ? "Current step" : "Upcoming"}</small></div></li>;
              })}
            </ol>
          )}
        </aside>

        <section className="onboarding-card rounded-[1.4rem] border border-[var(--line)] bg-white p-5 shadow-[0_24px_70px_rgba(49,35,27,.07)] sm:p-8">
          {completed ? (
            <div className="py-4 sm:py-8">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--teal)] text-xl font-bold text-white">✓</span>
              <p className="vendor-kicker mt-7">Setup complete</p>
              <h2 className="display mt-2 text-3xl">{selected.finish}</h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-[var(--muted)]">{selected.finishBody}</p>
              {role === "vendor" && <div className="mt-6 rounded-xl border border-[rgba(162,124,71,.24)] bg-[#faf7f1] p-4"><strong className="text-sm">Approval pending</strong><p className="mt-1 text-xs leading-6 text-[var(--muted)]">Production access stays locked until an admin marks the vendor account active. The button below opens preview data only.</p></div>}
              <Link className="btn mt-7" href={selected.destination}>Open {role} dashboard preview</Link>
            </div>
          ) : step === 1 ? (
            <form className="grid gap-5" onSubmit={continueForm}>
              <div><p className="vendor-kicker">Step 1 of 3</p><h2 className="display mt-2 text-3xl">Tell us who you are.</h2><p className="mt-3 text-sm leading-7 text-[var(--muted)]">These details are attached to your verified account, not to the choice made on the login screen.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="label">Full name<input className="input" name="name" autoComplete="name" required placeholder="Your full name" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} /></label>
                <label className="label">Mobile number<input className="input" name="phone" autoComplete="tel" required placeholder="+65 8123 4567" value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} /></label>
              </div>
              <label className="label">Country<select className="input" name="country" value={profile.country} onChange={(event) => setProfile((current) => ({ ...current, country: event.target.value }))} required><option>Singapore</option><option>Indonesia</option><option>Malaysia</option><option>Cambodia</option><option>Other</option></select></label>
              <button className="btn mt-2 justify-self-start">Continue</button>
            </form>
          ) : step === 2 ? (
            <form className="grid gap-5" onSubmit={continueForm}>
              <div><p className="vendor-kicker">Step 2 of 3</p><h2 className="display mt-2 text-3xl">{role === "vendor" ? "Your organisation." : "How should we update you?"}</h2></div>
              {role === "vendor" ? (
                <>
                  <label className="label">Organisation name<input className="input" name="organisation" autoComplete="organization" required placeholder="Registered or trading name" value={profile.organisation} onChange={(event) => setProfile((current) => ({ ...current, organisation: event.target.value }))} /></label>
                  <label className="label">Primary service coverage<select className="input" name="coverage" value={profile.coverage} onChange={(event) => setProfile((current) => ({ ...current, coverage: event.target.value }))} required><option value="" disabled>Select coverage</option><option>Korban fulfilment</option><option>Wakaf Quran</option><option>Water projects</option><option>Food programmes</option><option>Multiple services</option></select></label>
                  <label className="label">Fulfilment regions<input className="input" name="regions" required placeholder="e.g. Bandung and West Java" value={profile.regions} onChange={(event) => setProfile((current) => ({ ...current, regions: event.target.value }))} /></label>
                </>
              ) : (
                <>
                  <fieldset className="grid gap-3"><legend className="label mb-1">Preferred update channel</legend>{["Email", "WhatsApp", "Telegram"].map((option) => <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[var(--line)] px-4 text-sm font-semibold" key={option}><input type="radio" name="updates" value={option} checked={profile.updates === option} onChange={(event) => setProfile((current) => ({ ...current, updates: event.target.value }))} />{option}</label>)}</fieldset>
                  <label className="flex items-start gap-3 rounded-xl bg-[var(--teal-soft)] p-4 text-xs leading-6 text-[var(--muted)]"><input className="mt-1" type="checkbox" checked={profile.proofNotifications} onChange={(event) => setProfile((current) => ({ ...current, proofNotifications: event.target.checked }))} />Notify me when proof is approved and ready to view.</label>
                </>
              )}
              <div className="flex flex-wrap gap-2"><button className="btn">Continue</button><button className="btn btn-secondary" type="button" onClick={() => setStep(1)}>Back</button></div>
            </form>
          ) : (
            <form className="grid gap-5" onSubmit={finish}>
              <div><p className="vendor-kicker">Step 3 of 3</p><h2 className="display mt-2 text-3xl">Review and continue.</h2><p className="mt-3 text-sm leading-7 text-[var(--muted)]">In production, this step saves the profile and applies the trusted account state returned by the server.</p></div>
              <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
                <div className="bg-[var(--cream)] p-4"><span className="vendor-field-label">Account type</span><strong className="mt-2 block text-sm capitalize">{role}</strong></div>
                <div className="bg-[var(--cream)] p-4"><span className="vendor-field-label">Profile</span><strong className="mt-2 block text-sm">{role === "vendor" ? profile.organisation : profile.name}</strong></div>
                <div className="bg-[var(--cream)] p-4"><span className="vendor-field-label">Country</span><strong className="mt-2 block text-sm">{profile.country}</strong></div>
                <div className="bg-[var(--cream)] p-4"><span className="vendor-field-label">Access after setup</span><strong className="mt-2 block text-sm">{role === "vendor" ? "Pending admin approval" : "Customer dashboard"}</strong></div>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-[var(--line)] p-4 text-xs leading-6 text-[var(--muted)]"><input className="mt-1" type="checkbox" required />I confirm these details are accurate and can be used to operate my account.</label>
              <div className="flex flex-wrap gap-2"><button className="btn">Complete setup</button><button className="btn btn-secondary" type="button" onClick={() => setStep(2)}>Back</button></div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
