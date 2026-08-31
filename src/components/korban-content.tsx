"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitKorbanOrder } from "@/app/(marketing)/korban/actions";
import { CustomerAccountGate } from "@/components/customer-account-gate";
import { ServiceDetailFrame } from "@/components/service-detail-frame";
import { shouldResumeCheckout } from "@/lib/customer-account-handoff";
import transaction from "./service-transaction.module.css";

export interface KorbanPackage {
  id: string;
  label: string;
  priceCents: number;
}

const details = {
  description: "Book a Korban carried out overseas by an approved partner. Your participant names stay attached to the order from request to completion.",
};

const DRAFT_KEY = "korban-draft";

interface Draft {
  requestId: string;
  packageId: KorbanPackage["id"];
  quantity: number;
  names: string[];
  customerName: string;
  customerPhone: string;
  resumeCheckout?: boolean;
}

export function KorbanContent({ initialRequestId, packages }: { initialRequestId: string; packages: KorbanPackage[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const resumed = useRef(false);
  const [requestId, setRequestId] = useState(initialRequestId);
  const [packageId, setPackageId] = useState(packages[0].id);
  const [quantity, setQuantity] = useState(1);
  const [names, setNames] = useState<string[]>([""]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [accountGateOpen, setAccountGateOpen] = useState(false);
  const [resumeCheckout, setResumeCheckout] = useState(false);
  const [state, action, pending] = useActionState(submitKorbanOrder, undefined);

  const selected = packages.find((item) => item.id === packageId) ?? packages[0];
  const totalCents = selected.priceCents * quantity;

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    sessionStorage.removeItem(DRAFT_KEY);
    try {
      const draft = JSON.parse(raw) as Draft;
      // Restoring a browser-only draft is the external synchronization this effect owns.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRequestId(draft.requestId || initialRequestId);
      setPackageId(draft.packageId);
      setQuantity(draft.quantity);
      setNames(draft.names);
      setCustomerName(draft.customerName);
      setCustomerPhone(draft.customerPhone);
      setResumeCheckout(shouldResumeCheckout(draft.resumeCheckout, window.location.search));
    } catch {
      // ignore malformed draft
    }
  }, [initialRequestId]);

  useEffect(() => {
    if (state && !state.ok && "requiresLogin" in state && state.requiresLogin) {
      const draft: Draft = { requestId, packageId, quantity, names, customerName, customerPhone, resumeCheckout: true };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      // This external Server Action result is the only source that may open the account gate.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccountGateOpen(true);
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!resumeCheckout || resumed.current) return;
    resumed.current = true;
    formRef.current?.requestSubmit();
  }, [resumeCheckout]);

  function updateQuantity(next: number) {
    const bounded = Math.max(1, Math.min(7, next));
    setQuantity(bounded);
    setNames((current) => Array.from({ length: bounded }, (_, i) => current[i] ?? ""));
  }

  return (
    <ServiceDetailFrame
      family="Services"
      familyHref="/services"
      title="Korban"
      promise={details.description}
      price={`S$${(selected.priceCents / 100).toLocaleString()}`}
      priceNote="per package"
      imageSrc="/services-korban-care.png"
      imageAlt="Hands carefully preparing a Korban service"
      imagePosition="center center"
    >
        <form ref={formRef} className={transaction.form} action={action}>
            <header className={transaction.formIntro}>
              <span>Request details</span>
              <h2>Arrange your Korban</h2>
              <p>Choose a live package, add the participant names, then confirm who we should keep updated.</p>
            </header>
            {state && "error" in state && <p className="auth-error">{state.error}</p>}
            <input type="hidden" name="packageId" value={packageId} />
            <input type="hidden" name="quantity" value={quantity} />
            <input type="hidden" name="requestId" value={requestId} />

            <fieldset className={transaction.section}>
              <legend className={transaction.sectionTitle}>1. Choose a package</legend>
              <div className={transaction.field}>
              <span className={transaction.fieldLabel}>Package</span>
              <div className="option-row">
                {packages.map((p) => (
                  <label key={p.id} className={`option-tile ${packageId === p.id ? "is-active" : ""}`}>
                    <input className="sr-only" type="radio" name="package" checked={packageId === p.id} onChange={() => setPackageId(p.id)} />
                    <strong className="block text-sm">{p.label}</strong>
                    <span className="mt-1 block text-xs text-[var(--muted)]">S${(p.priceCents / 100).toLocaleString()}</span>
                  </label>
                ))}
              </div>
              <p className={transaction.helper}>Prices and package availability come from the current service offering.</p>
              </div>

              <div className={transaction.field}>
              <span className={transaction.fieldLabel}>Quantity</span>
              <div className={transaction.quantityRow}>
                <div className="stepper">
                  <button type="button" onClick={() => updateQuantity(quantity - 1)} aria-label="Decrease shares">−</button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => updateQuantity(quantity + 1)} aria-label="Increase shares">+</button>
                </div>
                <span className={transaction.helper}>Up to 7 packages per order.</span>
              </div>
              </div>
            </fieldset>

            <fieldset className={transaction.section}>
              <legend className={transaction.sectionTitle}>2. Add participant details</legend>
              <div className={transaction.field}>
              <span className={transaction.fieldLabel}>Participant name{names.length > 1 ? "s" : ""}</span>
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
              <p className={transaction.helper}>Each name remains attached to the correct package throughout the order.</p>
              </div>
            </fieldset>

            <fieldset className={transaction.section}>
              <legend className={transaction.sectionTitle}>3. Your contact details</legend>
            <label className="label">Your name
              <input className="input" name="customerName" required placeholder="Your full name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
            </label>
            <label className="label">Phone
              <input className="input" name="customerPhone" required placeholder="+65 8123 4567" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
            </label>
              <p className={transaction.helper}>Used for order updates and your completion record.</p>
            </fieldset>

            <div className={transaction.totalBlock}>
            <div className="buy-box-total">
              <span className="text-sm font-bold">Total</span>
              <strong className="numeral">S${(totalCents / 100).toLocaleString()}</strong>
            </div>

            <button type="submit" className={`btn ${transaction.submit}`} disabled={pending}>{pending ? "Submitting…" : "Continue"} <span aria-hidden="true">→</span></button>
            <p className={transaction.secureNote}>We save your request details before taking you to secure payment.</p>
            </div>
        </form>

        {accountGateOpen && <CustomerAccountGate next="/korban?resume=checkout" onClose={() => setAccountGateOpen(false)} />}

    </ServiceDetailFrame>
  );
}
