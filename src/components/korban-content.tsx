"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { submitKorbanOrder } from "@/app/(marketing)/korban/actions";

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

const DRAFT_KEY = "korban-draft";

interface Draft {
  packageId: string;
  quantity: number;
  names: string[];
  customerName: string;
  customerPhone: string;
}

export function KorbanContent() {
  const router = useRouter();
  const [packageId, setPackageId] = useState(packages[0].id);
  const [quantity, setQuantity] = useState(1);
  const [names, setNames] = useState<string[]>([""]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tab, setTab] = useState<"details" | "faq">("details");
  const [state, action, pending] = useActionState(submitKorbanOrder, undefined);

  const selected = packages.find((p) => p.id === packageId) ?? packages[0];
  const total = selected.price * quantity;

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    sessionStorage.removeItem(DRAFT_KEY);
    try {
      const draft = JSON.parse(raw) as Draft;
      setPackageId(draft.packageId);
      setQuantity(draft.quantity);
      setNames(draft.names);
      setCustomerName(draft.customerName);
      setCustomerPhone(draft.customerPhone);
    } catch {
      // ignore malformed draft
    }
  }, []);

  useEffect(() => {
    if (state && !state.ok && "requiresLogin" in state && state.requiresLogin) {
      const draft: Draft = { packageId, quantity, names, customerName, customerPhone };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      router.push("/login?next=/korban");
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateQuantity(next: number) {
    const bounded = Math.max(1, Math.min(7, next));
    setQuantity(bounded);
    setNames((current) => Array.from({ length: bounded }, (_, i) => current[i] ?? ""));
  }

  const submittedReference = state?.ok ? state.reference : null;

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

        {submittedReference ? (
          <div className="card mt-6 p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--gold)" }}>Order recorded</p>
            <h2 className="display mt-2 text-xl">{submittedReference}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Your Korban order is on record and will be offered to our fulfilment partners shortly. No payment has been taken yet.</p>
          </div>
        ) : (
          <form className="mt-6 grid gap-5" action={action}>
            {state && !state.ok && "error" in state && <p className="auth-error">{state.error}</p>}
            <input type="hidden" name="packageId" value={packageId} />
            <input type="hidden" name="quantity" value={quantity} />

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
                    name="participantName"
                    required
                    placeholder={`Participant ${i + 1} name`}
                    value={name}
                    onChange={(event) => setNames((current) => current.map((n, idx) => (idx === i ? event.target.value : n)))}
                  />
                ))}
              </div>
            </div>

            <label className="label">Your name
              <input className="input" name="customerName" required placeholder="Your full name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
            </label>
            <label className="label">Phone
              <input className="input" name="customerPhone" required placeholder="+65 8123 4567" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
            </label>

            <div className="buy-box-total">
              <span className="text-sm font-bold">Total</span>
              <strong className="numeral">S${total}</strong>
            </div>

            <button type="submit" className="btn" disabled={pending}>{pending ? "Submitting…" : "Continue"} <span aria-hidden="true">→</span></button>
            <p className="text-xs leading-5 text-[var(--muted)]">Working preview - no payment is taken. You'll be asked to log in if you aren't already.</p>
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
