"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { submitWakafContribution } from "@/app/(marketing)/wakaf/actions";
import { wakafProjects, type WakafProjectSlug } from "@/lib/wakaf-projects";

const draftKey = (slug: string) => `wakaf-draft-${slug}`;

interface Draft {
  requestId: string;
  amount: number;
  dedication: string;
  customerName: string;
  customerPhone: string;
}

export function WakafProjectContent({ initialRequestId, projectId, project, offering }: {
  initialRequestId: string;
  projectId: WakafProjectSlug;
  project: (typeof wakafProjects)[WakafProjectSlug];
  offering: { title: string; detail: string; minimumCents: number };
}) {
  const router = useRouter();
  const [requestId, setRequestId] = useState(initialRequestId);
  const minimum = offering.minimumCents / 100;
  const presets = [...new Set([minimum, 25, 50, 100, 250])].filter((value) => value >= minimum);
  const [amount, setAmount] = useState(presets[0] ?? minimum);
  const [dedication, setDedication] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tab, setTab] = useState<"details" | "impact">("details");
  const [state, action, pending] = useActionState(submitWakafContribution, undefined);

  useEffect(() => {
    const raw = sessionStorage.getItem(draftKey(projectId));
    if (!raw) return;
    sessionStorage.removeItem(draftKey(projectId));
    try {
      const draft = JSON.parse(raw) as Draft;
      // Restoring a browser-only draft is the external synchronization this effect owns.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRequestId(draft.requestId || initialRequestId);
      setAmount(draft.amount);
      setDedication(draft.dedication);
      setCustomerName(draft.customerName);
      setCustomerPhone(draft.customerPhone);
    } catch {
      // ignore malformed draft
    }
  }, [initialRequestId, projectId]);

  useEffect(() => {
    if (state && !state.ok && "requiresLogin" in state && state.requiresLogin) {
      const draft: Draft = { requestId, amount, dedication, customerName, customerPhone };
      sessionStorage.setItem(draftKey(projectId), JSON.stringify(draft));
      router.push(`/login?next=/wakaf/${projectId}`);
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="product-layout">
      <div className="product-media">
        <span className="status">Available</span>
        {project.icon}
      </div>

      <div>
        <h1 className="display product-title">{offering.title}</h1>
        <div className="product-price">
          <strong>From S${minimum}</strong>
          <small>minimum</small>
        </div>
        <p className="product-lead">{offering.detail}</p>

        <form className="mt-6 grid gap-5" action={action}>
            {state && "error" in state && <p className="auth-error">{state.error}</p>}
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="requestId" value={requestId} />

            <div>
              <span className="label mb-2 block">Contribution</span>
              <div className="flex flex-wrap gap-2">
                {presets.map((v) => (
                  <button type="button" key={v} className={`amount-pill ${amount === v ? "is-active" : ""}`} onClick={() => setAmount(v)}>S${v}</button>
                ))}
              </div>
              <label className="label mt-3">Custom amount (SGD)
                <input className="input" type="number" name="amount" min={minimum} step="0.01" value={amount} onChange={(event) => setAmount(Number(event.target.value))} required />
              </label>
            </div>

            <label className="label">Dedication <span className="font-normal text-[var(--muted)]">Optional</span>
              <input className="input" name="dedication" placeholder="In honour or memory of..." value={dedication} onChange={(event) => setDedication(event.target.value)} />
            </label>
            <label className="label">Your name
              <input className="input" name="customerName" required placeholder="Your full name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
            </label>
            <label className="label">Phone
              <input className="input" name="customerPhone" required placeholder="+65 8123 4567" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
            </label>

            <div className="buy-box-total">
              <span className="text-sm font-bold">Total</span>
              <strong className="numeral">S${amount}</strong>
            </div>

            <button type="submit" className="btn" disabled={pending}>{pending ? "Submitting…" : "Continue"} <span aria-hidden="true">→</span></button>
            <p className="text-xs leading-5 text-[var(--muted)]">You’ll be asked to log in before continuing to secure payment.</p>
        </form>

        <div className="detail-tabs">
          <button type="button" className={tab === "details" ? "is-active" : ""} onClick={() => setTab("details")}>Details</button>
          <button type="button" className={tab === "impact" ? "is-active" : ""} onClick={() => setTab("impact")}>Your impact</button>
        </div>
        <div className="pt-5">
          {tab === "details" ? (
            <p className="text-sm leading-6 text-[var(--muted)]">Project scope, minimums, and required proof are placeholders until the relevant partners confirm them.</p>
          ) : (
            <div className="grid gap-3">
              {project.impact.map(([amt, body]) => (
                <div key={amt} className="flex items-baseline gap-3 border-b border-[var(--line)] pb-3 last:border-0">
                  <strong className="numeral shrink-0 text-sm" style={{ color: "var(--teal-dark)" }}>{amt}</strong>
                  <p className="text-xs leading-6 text-[var(--muted)]">{body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
