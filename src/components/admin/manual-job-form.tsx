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

function money(cents: number) {
  return new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 2 }).format(cents / 100);
}

export function ManualJobForm({ offerings }: { offerings: ManualJobOffering[] }) {
  const [open, setOpen] = useState(false);
  const [offeringId, setOfferingId] = useState(offerings[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [amount, setAmount] = useState("");
  const [state, action, pending] = useActionState(createManualJobAction, undefined);
  const offering = useMemo(() => offerings.find((item) => item.id === offeringId) ?? null, [offerings, offeringId]);
  const isKorban = offering?.service_type === "korban";
  const total = isKorban ? (offering?.unit_amount ?? 0) * quantity : Math.round((Number(amount) || 0) * 100);

  function chooseOffering(id: string) {
    setOfferingId(id);
    setQuantity(1);
    setAmount("");
  }

  return (
    <div className={`admin-manual-job${open ? " is-open" : ""}`}>
      <div className="admin-manual-job-toggle">
        <button
          type="button"
          className={`btn btn-small${open ? " btn-secondary" : ""}`}
          aria-expanded={open}
          aria-controls="manual-job-form"
          disabled={!offerings.length}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close form" : offerings.length ? "Add job" : "No services available"}
        </button>
      </div>

      {open && (
        <section id="manual-job-form" className="card admin-manual-job-panel" aria-labelledby="manual-job-title">
          <header>
            <h2 id="manual-job-title" className="display text-lg">Add a paid offline order</h2>
            <p>Use this for phone, WhatsApp, or in-person customers. The job opens ready for vendor assignment.</p>
          </header>

          <form className="admin-manual-job-form" action={action}>
            {state?.error && <p className="auth-error" role="alert">{state.error} Your entries are still here.</p>}

            <fieldset className="admin-manual-job-section" disabled={pending}>
              <legend>Customer details</legend>
              <div className="admin-form-grid">
                <label className="label">Full name<input className="input" name="customerName" required maxLength={120} autoComplete="name" /></label>
                <label className="label">Phone number<input className="input" name="customerPhone" type="tel" required maxLength={25} autoComplete="tel" placeholder="+65 8123 4567" /></label>
              </div>
              <label className="label">Email for receipt and completion report<input className="input" name="customerEmail" type="email" required maxLength={254} autoComplete="email" /></label>
            </fieldset>

            <fieldset className="admin-manual-job-section" disabled={pending}>
              <legend>Service and payment</legend>
              <div className="admin-form-grid">
                <label className="label">Service package
                  <select className="input" name="offeringId" value={offeringId} onChange={(event) => chooseOffering(event.target.value)} required>
                    {offerings.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                  {offering && <small>{isKorban ? `${money(offering.unit_amount ?? 0)} per package` : `Minimum ${money(offering.min_amount ?? 0)}`}</small>}
                </label>
                <label className="label">Payment method
                  <select className="input" name="paymentMethod" defaultValue="PayNow" required><option>PayNow</option><option>Bank transfer</option><option>Cash</option><option>Other</option></select>
                </label>
              </div>
              <div className="admin-form-grid">
                {isKorban ? (
                  <label className="label">Quantity<input className="input" name="quantity" type="number" min="1" max="7" value={quantity} onChange={(event) => setQuantity(Math.min(7, Math.max(1, Number(event.target.value) || 1)))} required /></label>
                ) : (
                  <label className="label">Amount received (SGD)<input className="input" name="amount" type="number" min={(offering?.min_amount ?? 0) / 100} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required placeholder={`Minimum ${money(offering?.min_amount ?? 0)}`} /></label>
                )}
                <label className="label">Payment reference<input className="input" name="paymentReference" required maxLength={200} autoComplete="off" placeholder="Bank, PayNow, or receipt reference" /></label>
              </div>
              {isKorban && (
                <div className="admin-manual-participants">
                  <span className="label">Participant names</span>
                  <div className="admin-form-grid">{Array.from({ length: quantity }, (_, index) => <label className="label" key={index}>Participant {index + 1}<input className="input" name="participantName" required maxLength={120} /></label>)}</div>
                </div>
              )}
            </fieldset>

            <fieldset className="admin-manual-job-section" disabled={pending}>
              <legend>Beneficiary and dedication</legend>
              <div className="admin-form-grid">
                <label className="label">Service country<input className="input" name="beneficiaryCountry" required maxLength={100} autoComplete="country-name" /></label>
                <label className="label">State, province, or district <span>Optional</span><input className="input" name="beneficiaryState" maxLength={120} /></label>
                <label className="label">Village or locality <span>Optional</span><input className="input" name="beneficiaryVillage" maxLength={160} /></label>
                <label className="label">Partner organisation <span>Optional</span><input className="input" name="partnerOrganisation" maxLength={200} /></label>
              </div>
              <label className="label">Beneficiary names <span>Optional, one per line</span><textarea className="input vendor-textarea" name="beneficiaryNames" rows={3} maxLength={10000} /></label>
              <div className="admin-form-grid">
                <label className="label">Nameplate or dedication name(s) <span>Optional</span><textarea className="input vendor-textarea" name="dedication" rows={2} maxLength={300} /></label>
                <label className="label">Arabic spelling <span>Optional</span><textarea className="input vendor-textarea" name="dedicationArabic" dir="rtl" rows={2} maxLength={500} /></label>
              </div>
              <label className="label">Dedication instructions <span>Optional</span><textarea className="input vendor-textarea" name="dedicationRemarks" rows={3} maxLength={2000} /></label>
            </fieldset>

            <fieldset className="admin-manual-job-section" disabled={pending}>
              <legend>Vendor handoff</legend>
              <label className="label">Target completion date <span>Optional</span><input className="input" name="completionDeadline" type="date" min={new Date().toISOString().slice(0, 10)} /></label>
              <label className="label">Internal notes <span>Optional, never shown to the customer</span><textarea className="input vendor-textarea" name="notes" rows={3} maxLength={2000} /></label>
            </fieldset>

            <div className="admin-manual-job-submit">
              <div><span>Order total</span><strong className="display numeral">{total > 0 ? money(total) : "Enter amount"}</strong><small>Recorded as paid offline</small></div>
              <button type="submit" className="btn" disabled={pending || total <= 0}>{pending ? "Creating job…" : "Create job"}</button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
