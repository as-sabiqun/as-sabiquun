"use client";

import { useActionState, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { createOrder, submitEnquiry, type ActionState } from "@/app/actions";
import { demoOfferings, money } from "@/lib/domain";

const initialState: ActionState = {};

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button className="btn w-full" disabled={pending}>{pending ? "Working…" : children}</button>;
}

function Message({ state }: { state: ActionState }) {
  if (!state.error && !state.success) return null;
  return <p role="status" className={`rounded-xl p-3 text-sm ${state.error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>{state.error || state.success}</p>;
}

const contactFields = <><label className="label">Full name<input className="input" name="full_name" autoComplete="name" required /></label><div className="grid gap-5 sm:grid-cols-2"><label className="label">Email<input className="input" type="email" name="email" autoComplete="email" required /></label><label className="label">Mobile number<input className="input" type="tel" name="phone" autoComplete="tel" placeholder="+65" required /></label></div></>;

export function KorbanForm() {
  const [quantity, setQuantity] = useState(1);
  const [state, action] = useActionState(createOrder, initialState);
  const offering = demoOfferings[0];
  return <form action={action} className="card grid gap-5 p-6 md:p-8"><input type="hidden" name="offering_id" value={offering.id} /><div className="flex flex-col items-start justify-between gap-4 sm:flex-row"><div><span className="status">Demo offering</span><h2 className="display mt-3 text-4xl font-semibold">{offering.title}</h2><p className="mt-2 text-sm text-[var(--muted)]">{offering.location} · {offering.detail}</p></div><strong className="display text-3xl text-[var(--teal)]">{money(offering.unit_amount)}</strong></div><hr className="border-[var(--line)]" />{contactFields}<label className="label">Number of shares<select className="input" name="quantity" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>{[1,2,3,4,5,6,7].map(n => <option key={n}>{n}</option>)}</select></label><div className="grid gap-3"><p className="text-sm font-bold text-[var(--teal-dark)]">Participant name{quantity > 1 ? "s" : ""}</p>{Array.from({ length: quantity }, (_, i) => <input key={i} className="input" name="participant_names" required aria-label={`Participant ${i + 1} name`} placeholder={`Participant ${i + 1}`} />)}</div><label className="label">Notes <span className="font-normal text-[var(--muted)]">Optional</span><textarea className="input min-h-24 resize-y" name="notes" /></label><label className="flex items-start gap-3 text-sm leading-6 text-[var(--muted)]"><input className="mt-1" type="checkbox" required />I understand this is a demonstration and no real Korban or payment will occur.</label><Message state={state} /><div className="rounded-xl bg-[var(--teal-soft)] p-4 text-sm"><div className="flex justify-between"><span>Demo total</span><strong>{money((offering.unit_amount || 0) * quantity)}</strong></div></div><Submit>Continue to demo checkout</Submit></form>;
}

export function WakafForm({ offeringSlug }: { offeringSlug?: string }) {
  const projects = demoOfferings.filter((offering) => offering.service_type === "wakaf");
  const initialProject = projects.find((project) => project.slug === offeringSlug) || projects[0];
  const [projectId, setProjectId] = useState(initialProject.id);
  const [amount, setAmount] = useState(Math.max(25, (initialProject.min_amount || 0) / 100));
  const [state, action] = useActionState(createOrder, initialState);
  const project = projects.find((item) => item.id === projectId) || initialProject;
  const minimum = (project.min_amount || 0) / 100;

  return (
    <form action={action} className="card grid gap-5 p-6 md:p-8">
      <input type="hidden" name="offering_id" value={projectId} />
      <div>
        <span className="status">Demo contribution</span>
        <h2 className="display mt-3 text-4xl font-semibold">{offeringSlug ? project.title : "Choose where to contribute"}</h2>
        {offeringSlug && <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Minimum contribution {money(project.min_amount)}</p>}
      </div>
      {!offeringSlug && (
        <div className="grid gap-3">
          {projects.map((item) => (
            <label key={item.id} className={`cursor-pointer rounded-2xl border p-4 ${projectId === item.id ? "border-[var(--teal)] bg-[var(--teal-soft)]" : "border-[var(--line)]"}`}>
              <input className="sr-only" type="radio" name="project" value={item.id} checked={projectId === item.id} onChange={() => { setProjectId(item.id); setAmount(Math.max(25, (item.min_amount || 0) / 100)); }} />
              <strong>{item.title}</strong>
              <span className="mt-1 block text-xs text-[var(--muted)]">Minimum {money(item.min_amount)}</span>
            </label>
          ))}
        </div>
      )}
      {contactFields}
      <div>
        <p className="label mb-3">Contribution amount</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {[25, 50, 100, 250].filter((value) => value >= minimum).map((value) => (
            <button type="button" key={value} onClick={() => setAmount(value)} className={`rounded-full border px-4 py-2 text-sm font-bold ${amount === value ? "border-[var(--teal)] bg-[var(--teal)] text-white" : "border-[var(--line)]"}`}>S${value}</button>
          ))}
        </div>
        <label className="label">Custom SGD amount<input className="input" type="number" name="amount" min={minimum} step="1" value={amount} onChange={(event) => setAmount(Number(event.target.value))} required /></label>
      </div>
      <label className="label">Dedication <span className="font-normal text-[var(--muted)]">Optional</span><input className="input" name="dedication" placeholder="In honour or memory of..." /></label>
      <label className="label">Notes <span className="font-normal text-[var(--muted)]">Optional</span><textarea className="input min-h-24 resize-y" name="notes" /></label>
      <label className="flex items-start gap-3 text-sm leading-6 text-[var(--muted)]"><input className="mt-1" type="checkbox" required />I understand this is demonstration content and no real Wakaf or payment will occur.</label>
      <Message state={state} />
      <Submit>Continue to demo checkout</Submit>
    </form>
  );
}

export function CustomerReportForm() {
  const [sent, setSent] = useState(false);

  function sendReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl bg-[var(--teal-soft)] p-5" role="status">
        <span className="vendor-kicker text-[var(--teal)]">Report recorded</span>
        <h3 className="mt-2 text-lg font-semibold">The team can now review your request.</h3>
        <p className="mt-2 text-xs leading-6 text-[var(--muted)]">This is a dashboard preview, so the report has not been sent outside this page.</p>
        <button className="btn btn-secondary btn-small mt-5" type="button" onClick={() => setSent(false)}>Send another report</button>
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={sendReport}>
      <label className="label">Related order<select className="input" name="order_reference" defaultValue="ASB-260722-014"><option value="ASB-260722-014">ASB-260722-014 - Korban overseas</option><option value="ASB-260719-021">ASB-260719-021 - Wakaf Quran</option><option value="general">General account question</option></select></label>
      <label className="label">What do you need help with?<select className="input" name="issue_type"><option>Order status</option><option>Participant details</option><option>Payment or receipt</option><option>Proof or certificate</option><option>Something else</option></select></label>
      <label className="label">Tell us what happened<textarea className="input min-h-32 resize-y" name="message" minLength={10} required placeholder="Include the detail our team needs to check." /></label>
      <button className="btn justify-self-start">Send report</button>
    </form>
  );
}

export function ContactForm() {
  const [state, action] = useActionState(submitEnquiry, initialState);
  return <form action={action} className="card grid gap-5 p-6 md:p-8">{contactFields}<label className="label">Topic<select className="input" name="topic"><option value="islamic-services">Islamic services</option><option value="ai">AI consultancy</option><option value="business">Business consultancy</option><option value="partnership">Partnership</option><option value="other">Other</option></select></label><label className="label">Message<textarea className="input min-h-36 resize-y" name="message" minLength={10} required /></label><Message state={state} /><Submit>Send demo enquiry</Submit></form>;
}
