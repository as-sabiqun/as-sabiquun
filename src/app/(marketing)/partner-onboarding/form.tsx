"use client";

import { ArrowRight, Check } from "lucide-react";
import { useActionState, useState } from "react";
import { vendorServiceOptions, vendorTypes, type VendorServiceSlug } from "@/lib/vendor-options";
import { completePartnerOnboarding } from "./actions";
import styles from "./partner-onboarding.module.css";

export function PartnerOnboardingForm({ initialName, next }: { initialName: string; next: string }) {
  const [state, action, pending] = useActionState(completePartnerOnboarding.bind(null, next), undefined);
  const [services, setServices] = useState<VendorServiceSlug[]>([]);

  function toggle(slug: VendorServiceSlug) {
    setServices((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);
  }

  return (
    <form className={styles.form} action={action}>
      {state?.error && <p className={styles.error} role="alert">{state.error}</p>}
      <fieldset className={styles.section} disabled={pending}>
        <legend><span>01</span><span>Organisation and contact<small>Tell us who we will work with day to day.</small></span></legend>
        <div className={styles.fieldGrid}>
          <label>Organisation name<input name="organisationName" defaultValue={initialName} required maxLength={200} autoComplete="organization" /></label>
          <label>Contact person<input name="contactPerson" required maxLength={200} autoComplete="name" /></label>
          <label>Phone<input name="phone" type="tel" required maxLength={25} autoComplete="tel" placeholder="+65 8123 4567" /></label>
          <label>WhatsApp <span>Optional</span><input name="whatsapp" type="tel" maxLength={25} placeholder="+65 8123 4567" /></label>
          <label>Country<input name="country" required maxLength={120} autoComplete="country-name" /></label>
          <label>City / full address<input name="cityAddress" required maxLength={200} autoComplete="street-address" /></label>
        </div>
      </fieldset>

      <fieldset className={styles.section} disabled={pending}>
        <legend><span>02</span><span>Service capability<small>Choose the work your organisation can fulfil.</small></span></legend>
        <label className={styles.selectField}>Partner type<select name="vendorType" required defaultValue=""><option value="" disabled>Select a partner type</option>{vendorTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        <div className={styles.serviceHeader} id="service-options-label"><strong>Service options</strong><span>Select at least one</span></div>
        <div className={styles.serviceGrid} role="group" aria-labelledby="service-options-label">
          {vendorServiceOptions.map((service) => {
            const selected = services.includes(service.slug);
            return <label key={service.slug} className={`${styles.serviceOption} ${selected ? styles.serviceSelected : ""}`}><input type="checkbox" name="services" value={service.slug} checked={selected} onChange={() => toggle(service.slug)} /><span className={styles.checkMark} aria-hidden="true">{selected && <Check />}</span><span>{service.title}</span></label>;
          })}
        </div>
      </fieldset>

      <fieldset className={styles.section} disabled={pending} aria-describedby="settlement-note">
        <legend><span>03</span><span>Settlement details<small>Provide the account used for approved payments.</small></span></legend>
        <p className={styles.settlementNote} id="settlement-note">Vendor payments are recorded in Singapore dollars (SGD). These details are visible only to authorised staff.</p>
        <div className={styles.fieldGrid}>
          <label>Bank name<input name="bankName" required maxLength={200} autoComplete="off" /></label>
          <label>Account name<input name="bankAccountName" required maxLength={200} autoComplete="off" /></label>
          <label>Account number<input name="bankAccountNumber" required maxLength={200} inputMode="numeric" autoComplete="off" /></label>
          <label>SWIFT code <span>If applicable</span><input name="swiftCode" maxLength={200} autoCapitalize="characters" autoComplete="off" /></label>
        </div>
      </fieldset>

      <div className={styles.submitRow}>
        <div><strong>Ready for review?</strong><p>Submitting signs you out while the profile awaits approval.</p></div>
        <button type="submit" disabled={pending || services.length === 0}>{pending ? "Submitting profile…" : <>Submit for approval <ArrowRight aria-hidden="true" /></>}</button>
      </div>
    </form>
  );
}
