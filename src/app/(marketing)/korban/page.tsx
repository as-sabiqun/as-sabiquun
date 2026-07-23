"use client";

import { useState, type FormEvent } from "react";

const packages = [
  { id: "share", label: "1 cow share", price: 280 },
  { id: "goat", label: "1 goat/sheep", price: 320 },
  { id: "cow", label: "Full cow (7 shares)", price: 1960 },
];

const facts = [
  ["Fulfilment location", "Coordinated overseas with an approved partner"],
  ["Documented completion", "Photos or video reviewed before being returned to you"],
  ["Participant record", "Every name stays connected to the correct order"],
];

export default function KorbanPage() {
  const [packageId, setPackageId] = useState(packages[0].id);
  const [quantity, setQuantity] = useState(1);
  const [names, setNames] = useState<string[]>([""]);
  const [submitted, setSubmitted] = useState(false);

  const selected = packages.find((p) => p.id === packageId) ?? packages[0];
  const total = selected.price * quantity;

  function updateQuantity(next: number) {
    const bounded = Math.max(1, Math.min(7, next));
    setQuantity(bounded);
    setNames((current) => Array.from({ length: bounded }, (_, i) => current[i] ?? ""));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <section className="page-header">
        <div className="container">
          <p className="eyebrow-label">Korban</p>
          <h1 className="display">Korban, coordinated with care.</h1>
          <p className="lede">Choose a package, add participant names, and keep the service journey connected from request to completion.</p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container grid items-start gap-12 lg:grid-cols-[.62fr_1.38fr]">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow-label" style={{ color: "var(--gold)" }}>What&apos;s included</p>
            <div className="mt-5 grid gap-4">
              {facts.map(([title, body]) => (
                <div key={title} className="border-b border-[var(--line)] pb-4 last:border-0">
                  <strong className="text-sm">{title}</strong>
                  <p className="mt-1 text-xs leading-6 text-[var(--muted)]">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border-l-[3px] border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_8%,var(--cream))] p-4">
              <strong className="text-sm">Preview content</strong>
              <p className="mt-1 text-xs leading-6 text-[var(--muted)]">Package, pricing, and location will be confirmed before launch. This is a working preview - no payment is taken.</p>
            </div>
          </div>

          {submitted ? (
            <div className="card p-8 text-center">
              <p className="eyebrow-label" style={{ color: "var(--gold)" }}>Preview submitted</p>
              <h2 className="display mt-3 text-2xl">Your request has been recorded.</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">In production, this becomes an amanah record you can follow through team review, fulfilment, and completion proof. No live order has been created.</p>
              <button type="button" className="btn mt-6" onClick={() => setSubmitted(false)}>Start another preview</button>
            </div>
          ) : (
            <form className="card grid gap-6 p-6 md:p-8" onSubmit={submit}>
              <div>
                <p className="eyebrow-label" style={{ color: "var(--gold)" }}>01 - Package</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {packages.map((p) => (
                    <label key={p.id} className={`cursor-pointer rounded-2xl border-1.5 p-4 transition-colors ${packageId === p.id ? "border-[var(--teal)] bg-[var(--teal-soft)]" : "border-[var(--line)]"}`}>
                      <input className="sr-only" type="radio" name="package" checked={packageId === p.id} onChange={() => setPackageId(p.id)} />
                      <strong className="block text-sm">{p.label}</strong>
                      <span className="mt-1 block text-xs text-[var(--muted)]">S${p.price}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="eyebrow-label" style={{ color: "var(--gold)" }}>02 - Shares</p>
                <div className="mt-3 flex items-center gap-3">
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => updateQuantity(quantity - 1)} aria-label="Decrease shares">−</button>
                  <span className="numeral w-8 text-center text-lg">{quantity}</span>
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => updateQuantity(quantity + 1)} aria-label="Increase shares">+</button>
                  <span className="text-xs text-[var(--muted)]">up to 7 shares per order</span>
                </div>
              </div>

              <div>
                <p className="eyebrow-label" style={{ color: "var(--gold)" }}>03 - Participants</p>
                <div className="mt-3 grid gap-3">
                  {names.map((name, i) => (
                    <input
                      key={i}
                      className="input"
                      required
                      placeholder={`Participant ${i + 1} name`}
                      value={name}
                      onChange={(event) => setNames((current) => current.map((n, idx) => (idx === i ? event.target.value : n)))}
                    />
                  ))}
                </div>
              </div>

              <label className="label">Your name<input className="input" required placeholder="Your full name" /></label>
              <label className="label">Email<input className="input" type="email" required placeholder="you@example.com" /></label>

              <div className="flex items-center justify-between rounded-2xl bg-[var(--teal-soft)] p-4">
                <span className="text-sm font-bold">Preview total</span>
                <strong className="numeral text-xl" style={{ color: "var(--teal-dark)" }}>S${total}</strong>
              </div>

              <button type="submit" className="btn">Continue with this preview <span aria-hidden="true">→</span></button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
