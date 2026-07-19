"use client";

import { useActionState, useState } from "react";
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

export function WakafForm() {
  const projects = demoOfferings.filter(o => o.service_type === "wakaf");
  const [projectId, setProjectId] = useState(projects[0].id);
  const [amount, setAmount] = useState(25);
  const [state, action] = useActionState(createOrder, initialState);
  const project = projects.find(p => p.id === projectId)!;
  return <form action={action} className="card grid gap-5 p-6 md:p-8"><input type="hidden" name="offering_id" value={projectId} /><div><span className="status">Demo projects</span><h2 className="display mt-3 text-4xl font-semibold">Choose where to contribute</h2></div><div className="grid gap-3">{projects.map(p => <label key={p.id} className={`cursor-pointer rounded-2xl border p-4 ${projectId === p.id ? "border-[var(--teal)] bg-[var(--teal-soft)]" : "border-[var(--line)]"}`}><input className="sr-only" type="radio" name="project" value={p.id} checked={projectId === p.id} onChange={() => { setProjectId(p.id); setAmount(Math.max(25, (p.min_amount || 0) / 100)); }} /><strong>{p.title}</strong><span className="mt-1 block text-xs text-[var(--muted)]">Minimum {money(p.min_amount)}</span></label>)}</div>{contactFields}<div><p className="label mb-3">Contribution amount</p><div className="mb-3 flex flex-wrap gap-2">{[25,50,100,250].map(v => <button type="button" key={v} onClick={() => setAmount(v)} className={`rounded-full border px-4 py-2 text-sm font-bold ${amount === v ? "border-[var(--teal)] bg-[var(--teal)] text-white" : "border-[var(--line)]"}`}>S${v}</button>)}</div><label className="label">Custom SGD amount<input className="input" type="number" name="amount" min={(project.min_amount || 0) / 100} step="1" value={amount} onChange={e => setAmount(Number(e.target.value))} required /></label></div><label className="label">Dedication <span className="font-normal text-[var(--muted)]">Optional</span><input className="input" name="dedication" placeholder="In honour or memory of…" /></label><label className="label">Notes <span className="font-normal text-[var(--muted)]">Optional</span><textarea className="input min-h-24" name="notes" /></label><label className="flex items-start gap-3 text-sm leading-6 text-[var(--muted)]"><input className="mt-1" type="checkbox" required />I understand this is demonstration content and no real Wakaf or payment will occur.</label><Message state={state} /><Submit>Continue to demo checkout</Submit></form>;
}

export function ContactForm() {
  const [state, action] = useActionState(submitEnquiry, initialState);
  return <form action={action} className="card grid gap-5 p-6 md:p-8">{contactFields}<label className="label">Topic<select className="input" name="topic"><option value="islamic-services">Islamic services</option><option value="ai">AI consultancy</option><option value="business">Business consultancy</option><option value="partnership">Partnership</option><option value="other">Other</option></select></label><label className="label">Message<textarea className="input min-h-36 resize-y" name="message" minLength={10} required /></label><Message state={state} /><Submit>Send demo enquiry</Submit></form>;
}
