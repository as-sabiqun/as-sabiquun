"use client";

import { useActionState, useState } from "react";
import { completePartnerOnboarding } from "./actions";
import { vendorServiceOptions, vendorTypes, type VendorServiceSlug } from "@/lib/vendor-options";

export function PartnerOnboardingForm({ initialName }: { initialName: string }) {
  const [state, action, pending] = useActionState(completePartnerOnboarding, undefined);
  const [services, setServices] = useState<VendorServiceSlug[]>([]);

  function toggle(slug: VendorServiceSlug) {
    setServices((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);
  }

  return (
    <form className="partner-onboarding-form" action={action}>
      {state?.error && <p className="auth-error" role="alert">{state.error}</p>}

      <fieldset>
        <legend><span>01</span> Organisation and contact</legend>
        <div className="admin-form-grid">
          <label className="label">Organisation name<input className="input" name="organisationName" defaultValue={initialName} required maxLength={200} /></label>
          <label className="label">Contact person<input className="input" name="contactPerson" required maxLength={200} /></label>
        </div>
        <div className="admin-form-grid mt-4">
          <label className="label">Phone<input className="input" name="phone" required maxLength={25} placeholder="+65 8123 4567" /></label>
          <label className="label">WhatsApp <span className="font-normal text-[var(--muted)]">Optional</span><input className="input" name="whatsapp" maxLength={25} placeholder="+65 8123 4567" /></label>
        </div>
        <div className="admin-form-grid mt-4">
          <label className="label">Country<input className="input" name="country" required maxLength={120} /></label>
          <label className="label">City / full address<input className="input" name="cityAddress" required maxLength={200} /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend><span>02</span> Service capability</legend>
        <label className="label">Partner type<select className="input" name="vendorType" required defaultValue=""><option value="" disabled>Select a partner type</option>{vendorTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        <div className="admin-checkbox-group mt-4">
          {vendorServiceOptions.map((service) => <label key={service.slug} className={`admin-checkbox-pill ${services.includes(service.slug) ? "is-active" : ""}`}><input type="checkbox" name="services" value={service.slug} checked={services.includes(service.slug)} onChange={() => toggle(service.slug)} />{service.title}</label>)}
        </div>
      </fieldset>

      <fieldset>
        <legend><span>03</span> Settlement details</legend>
        <p className="partner-onboarding-note">Vendor payments are recorded in SGD. These details are visible only to authorised staff.</p>
        <div className="admin-form-grid mt-4">
          <label className="label">Bank name<input className="input" name="bankName" required maxLength={200} /></label>
          <label className="label">Account name<input className="input" name="bankAccountName" required maxLength={200} /></label>
        </div>
        <div className="admin-form-grid mt-4">
          <label className="label">Account number<input className="input" name="bankAccountNumber" required maxLength={200} /></label>
          <label className="label">SWIFT code <span className="font-normal text-[var(--muted)]">If applicable</span><input className="input" name="swiftCode" maxLength={200} /></label>
        </div>
      </fieldset>

      <button type="submit" className="btn" disabled={pending || services.length === 0}>{pending ? "Submitting…" : "Submit for approval"}</button>
    </form>
  );
}
