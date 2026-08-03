"use client";

import { useActionState, useMemo, useState } from "react";
import { createManualJobAction } from "@/app/admin/actions";

export interface ManualJobOffering {
  id: string;
  title: string;
  service_type: "korban" | "wakaf";
  category_slug: string;
  unit_amount: number | null;
  min_amount: number | null;
}

export function ManualJobForm({ offerings }: { offerings: ManualJobOffering[] }) {
  const [open, setOpen] = useState(false);
  const [offeringId, setOfferingId] = useState(offerings[0]?.id ?? "");
  const [state, action, pending] = useActionState(createManualJobAction, undefined);
  const offering = useMemo(() => offerings.find((item) => item.id === offeringId) ?? null, [offerings, offeringId]);
  const isKorban = offering?.service_type === "korban";

  return (
    <>
      <button type="button" className="btn btn-small" onClick={() => setOpen((value) => !value)}>
        {open ? "Cancel" : "Add manual job"}
      </button>
      {open && (
        <section className="card admin-manual-job-panel" aria-label="Create a manual job">
          <header>
            <div><h2 className="display text-lg">Add a manual job</h2><p>For phone, WhatsApp, or in-person orders. This records offline payment and creates no customer login.</p></div>
          </header>
          <form className="grid gap-6" action={action}>
            {state?.error && <p className="auth-error">{state.error}</p>}
            <fieldset className="grid gap-4">
              <legend className="label">Customer</legend>
              <div className="admin-form-grid">
                <label className="label">Full name<input className="input" name="customerName" required maxLength={120} /></label>
                <label className="label">Phone<input className="input" name="customerPhone" required maxLength={25} placeholder="+65 8123 4567" /></label>
              </div>
              <label className="label">Email for the completion report<input className="input" name="customerEmail" type="email" required maxLength={254} /></label>
            </fieldset>

            <fieldset className="grid gap-4">
              <legend className="label">Service and payment</legend>
              <div className="admin-form-grid">
                <label className="label">Service package
                  <select className="input" name="offeringId" value={offeringId} onChange={(event) => setOfferingId(event.target.value)} required>
                    {offerings.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                </label>
                <label className="label">Payment method
                  <select className="input" name="paymentMethod" defaultValue="Bank transfer"><option>Bank transfer</option><option>PayNow</option><option>Cash</option><option>Other</option></select>
                </label>
              </div>
              <div className="admin-form-grid">
                <label className="label">{isKorban ? "Quantity" : "Contribution (SGD)"}
                  {isKorban ? <input className="input" name="quantity" type="number" min="1" max="7" defaultValue="1" required /> : <input className="input" name="amount" type="number" min={(offering?.min_amount ?? 0) / 100} step="0.01" required placeholder={`Minimum S$${((offering?.min_amount ?? 0) / 100).toFixed(2)}`} />}
                </label>
                <label className="label">Payment reference<input className="input" name="paymentReference" required maxLength={200} placeholder="e.g. bank transfer reference" /></label>
              </div>
              {isKorban && <label className="label">Participant names <span className="font-normal text-[var(--muted)]">One name per line, matching the quantity</span><textarea className="input vendor-textarea" name="participantNames" rows={3} required maxLength={900} /></label>}
              <label className="label">Dedication or nameplate text <span className="font-normal text-[var(--muted)]">Optional</span><textarea className="input vendor-textarea" name="dedication" rows={2} maxLength={300} /></label>
            </fieldset>

            <fieldset className="grid gap-4">
              <legend className="label">Fulfilment handoff</legend>
              <div className="admin-form-grid">
                <label className="label">Service country <span className="font-normal text-[var(--muted)]">Needed before sending to vendors</span><input className="input" name="beneficiaryCountry" required maxLength={100} /></label>
                <label className="label">Target completion date <span className="font-normal text-[var(--muted)]">Optional</span><input className="input" name="completionDeadline" type="date" /></label>
              </div>
              <label className="label">Internal notes <span className="font-normal text-[var(--muted)]">Optional</span><textarea className="input vendor-textarea" name="notes" rows={3} maxLength={2000} /></label>
            </fieldset>
            <button type="submit" className="btn" disabled={pending}>{pending ? "Creating job…" : "Create paid job"}</button>
          </form>
        </section>
      )}
    </>
  );
}
