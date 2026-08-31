"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitWakafContribution } from "@/app/(marketing)/wakaf/actions";
import { wakafProjects, type WakafProjectSlug } from "@/lib/wakaf-projects";
import { CustomerAccountGate } from "@/components/customer-account-gate";
import { ServiceDetailFrame } from "@/components/service-detail-frame";
import { shouldResumeCheckout } from "@/lib/customer-account-handoff";
import transaction from "./service-transaction.module.css";

const draftKey = (slug: string) => `wakaf-draft-${slug}`;

interface Draft {
  requestId: string;
  offeringId: string;
  amount: number;
  dedication: string;
  customerName: string;
  customerPhone: string;
  resumeCheckout?: boolean;
}

export function WakafProjectContent({ initialRequestId, projectId, project, offerings }: {
  initialRequestId: string;
  projectId: WakafProjectSlug;
  project: (typeof wakafProjects)[WakafProjectSlug];
  offerings: { id: string; title: string; detail: string; minimumCents: number }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const resumed = useRef(false);
  const [requestId, setRequestId] = useState(initialRequestId);
  const [offeringId, setOfferingId] = useState(offerings[0].id);
  const offering = offerings.find((item) => item.id === offeringId) ?? offerings[0];
  const minimum = offering.minimumCents / 100;
  const presets = [...new Set([minimum, 25, 50, 100, 250])].filter((value) => value >= minimum);
  const [amount, setAmount] = useState(presets[0] ?? minimum);
  const [dedication, setDedication] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [accountGateOpen, setAccountGateOpen] = useState(false);
  const [resumeCheckout, setResumeCheckout] = useState(false);
  const [state, action, pending] = useActionState(submitWakafContribution, undefined);

  const projectImages: Record<WakafProjectSlug, { src: string; alt: string; position: string }> = {
    "water-pump": { src: "/landing-water-point.png", alt: "A community water point in use", position: "center center" },
    quran: { src: "/landing-quran-table.png", alt: "Copies of the Quran arranged on a table", position: "center center" },
    "food-for-orphans": { src: "/landing-hero-volunteers.png", alt: "Volunteers handing over a food parcel beside a delivery van", position: "center center" },
  };
  const projectImage = projectImages[projectId];

  useEffect(() => {
    const raw = sessionStorage.getItem(draftKey(projectId));
    if (!raw) return;
    sessionStorage.removeItem(draftKey(projectId));
    try {
      const draft = JSON.parse(raw) as Draft;
      // Restoring a browser-only draft is the external synchronization this effect owns.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRequestId(draft.requestId || initialRequestId);
      const restoredOffering = offerings.find((item) => item.id === draft.offeringId) ?? offerings[0];
      setOfferingId(restoredOffering.id);
      setAmount(Math.max(draft.amount, restoredOffering.minimumCents / 100));
      setDedication(draft.dedication);
      setCustomerName(draft.customerName);
      setCustomerPhone(draft.customerPhone);
      setResumeCheckout(shouldResumeCheckout(draft.resumeCheckout, window.location.search));
    } catch {
      // ignore malformed draft
    }
  }, [initialRequestId, projectId, offerings]);

  useEffect(() => {
    if (state && !state.ok && "requiresLogin" in state && state.requiresLogin) {
      const draft: Draft = { requestId, offeringId, amount, dedication, customerName, customerPhone, resumeCheckout: true };
      sessionStorage.setItem(draftKey(projectId), JSON.stringify(draft));
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

  return (
    <ServiceDetailFrame
      family="Wakaf"
      familyHref="/wakaf"
      title={project.title}
      promise={project.lead}
      price={`From S$${minimum.toLocaleString()}`}
      priceNote="minimum contribution"
      imageSrc={projectImage.src}
      imageAlt={projectImage.alt}
      imagePosition={projectImage.position}
    >
        <form ref={formRef} className={transaction.form} action={action}>
            <header className={transaction.formIntro}>
              <span>Contribution details</span>
              <h2>Arrange your contribution</h2>
              <p>Choose a live offering and amount, add an optional dedication, then confirm who we should keep updated.</p>
            </header>
            {state && "error" in state && <p className="auth-error">{state.error}</p>}
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="requestId" value={requestId} />
            <input type="hidden" name="offeringId" value={offering.id} />

            <fieldset className={transaction.section}>
              <legend className={transaction.sectionTitle}>1. Choose an amount</legend>
            {offerings.length > 1 && <label className="label">Offering
              <select className="input" value={offering.id} onChange={(event) => {
                const next = offerings.find((item) => item.id === event.target.value) ?? offerings[0];
                setOfferingId(next.id);
                setAmount(next.minimumCents / 100);
              }}>
                {offerings.map((item) => <option key={item.id} value={item.id}>{item.title} — from S${item.minimumCents / 100}</option>)}
              </select>
            </label>}

            <div className={transaction.field}>
              <span className={transaction.fieldLabel}>Contribution</span>
              <div className={transaction.amounts}>
                {presets.map((v) => (
                  <button type="button" key={v} className={`amount-pill ${amount === v ? "is-active" : ""}`} onClick={() => setAmount(v)}>S${v}</button>
                ))}
              </div>
              <label className="label mt-3">Custom amount (SGD)
                <input className="input" type="number" name="amount" min={minimum} step="0.01" value={amount} onChange={(event) => setAmount(Number(event.target.value))} required />
              </label>
              <p className={transaction.helper}>The minimum for this offering is S${minimum.toLocaleString()}.</p>
            </div>
            </fieldset>

            <fieldset className={transaction.section}>
              <legend className={transaction.sectionTitle}>2. Add a dedication</legend>
            <label className="label">Dedication <span className={transaction.optional}>Optional</span>
              <input className="input" name="dedication" placeholder="In honour or memory of..." value={dedication} onChange={(event) => setDedication(event.target.value)} />
            </label>
              <p className={transaction.helper}>If supplied, the dedication stays attached to this contribution record.</p>
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
              <strong className="numeral">S${amount}</strong>
            </div>

            <button type="submit" className={`btn ${transaction.submit}`} disabled={pending}>{pending ? "Submitting…" : "Continue"} <span aria-hidden="true">→</span></button>
            <p className={transaction.secureNote}>We save your contribution details before taking you to secure payment.</p>
            </div>
        </form>

        {accountGateOpen && <CustomerAccountGate next={`/wakaf/${projectId}?resume=checkout`} onClose={() => setAccountGateOpen(false)} />}

    </ServiceDetailFrame>
  );
}
