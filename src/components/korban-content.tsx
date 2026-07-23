"use client";

import { useState, type FormEvent } from "react";

const packages = [
  { id: "share", label: "1 cow share", price: 280 },
  { id: "goat", label: "1 goat/sheep", price: 320 },
  { id: "cow", label: "Full cow (7 shares)", price: 1960 },
];

const details = {
  description: "Book a Korban, coordinated overseas with an approved fulfilment partner. Every order stays connected to your participant names from request through completion.",
  facts: [
    ["Fulfilment location", "Coordinated overseas with an approved partner"],
    ["Documented completion", "Photos or video reviewed before being returned to you"],
    ["Participant record", "Every name stays connected to the correct order"],
  ],
};

export function KorbanContent() {
  const [packageId, setPackageId] = useState(packages[0].id);
  const [quantity, setQuantity] = useState(1);
  const [names, setNames] = useState<string[]>([""]);
  const [submitted, setSubmitted] = useState(false);
  const [tab, setTab] = useState<"details" | "faq">("details");

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
    <div className="product-layout">
      <div className="product-media">
        <span className="status">Available</span>
        <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M15 42c2-11 9-19 17-19 9 0 16 8 17 19" /><path d="M20 24c-3-1-6-4-7-8 6 0 10 2 13 6M44 24c3-1 6-4 7-8-6 0-10 2-13 6M23 42v7M41 42v7M27 32h.1M37 32h.1" /></svg>
      </div>

      <div>
        <h1 className="display product-title">Korban</h1>
        <div className="product-price">
          <strong>S${selected.price}</strong>
          <small>per share</small>
        </div>
        <p className="product-lead">{details.description}</p>

        {submitted ? (
          <div className="card mt-6 p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--gold)" }}>Preview submitted</p>
            <h2 className="display mt-2 text-xl">Your request has been recorded.</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">In production this becomes an amanah record you can follow through review, fulfilment, and proof. No live order was created.</p>
            <button type="button" className="btn mt-5" onClick={() => setSubmitted(false)}>Start another preview</button>
          </div>
        ) : (
          <form className="mt-6 grid gap-5" onSubmit={submit}>
            <div>
              <span className="label mb-2 block">Package</span>
              <div className="option-row">
                {packages.map((p) => (
                  <label key={p.id} className={`option-tile ${packageId === p.id ? "is-active" : ""}`}>
                    <input className="sr-only" type="radio" name="package" checked={packageId === p.id} onChange={() => setPackageId(p.id)} />
                    <strong className="block text-sm">{p.label}</strong>
                    <span className="mt-1 block text-xs text-[var(--muted)]">S${p.price}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span className="label mb-2 block">Shares</span>
              <div className="flex items-center gap-3">
                <div className="stepper">
                  <button type="button" onClick={() => updateQuantity(quantity - 1)} aria-label="Decrease shares">−</button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => updateQuantity(quantity + 1)} aria-label="Increase shares">+</button>
                </div>
                <span className="text-xs text-[var(--muted)]">up to 7 shares per order</span>
              </div>
            </div>

            <div>
              <span className="label mb-2 block">Participant name{names.length > 1 ? "s" : ""}</span>
              <div className="grid gap-3">
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

            <div className="buy-box-total">
              <span className="text-sm font-bold">Total</span>
              <strong className="numeral">S${total}</strong>
            </div>

            <button type="submit" className="btn">Continue <span aria-hidden="true">→</span></button>
            <p className="text-xs leading-5 text-[var(--muted)]">Working preview - no payment is taken.</p>
          </form>
        )}

        <div className="detail-tabs">
          <button type="button" className={tab === "details" ? "is-active" : ""} onClick={() => setTab("details")}>Details</button>
          <button type="button" className={tab === "faq" ? "is-active" : ""} onClick={() => setTab("faq")}>What's included</button>
        </div>
        <div className="pt-5">
          {tab === "details" ? (
            <p className="text-sm leading-6 text-[var(--muted)]">Package, pricing, and location will be confirmed with our operations team before launch.</p>
          ) : (
            <div className="grid gap-3">
              {details.facts.map(([title, body]) => (
                <div key={title} className="border-b border-[var(--line)] pb-3 last:border-0">
                  <strong className="text-sm">{title}</strong>
                  <p className="mt-1 text-xs leading-6 text-[var(--muted)]">{body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
