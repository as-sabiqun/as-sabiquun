"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { generatePassword, vendorServiceOptions, vendorTypes, type VendorServiceSlug, type VendorType } from "@/lib/admin-demo";
import { createVendorAccount } from "@/app/admin/vendors/actions";

export interface VendorRow {
  id: string;
  display_name: string;
  phone: string | null;
  vendor_type: string | null;
  services: string[];
  status: "active" | "suspended";
  jobsCompleted: number;
  jobsActive: number;
}

export function VendorsListReal({ vendors }: { vendors: VendorRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState(generatePassword());
  const [vendorType, setVendorType] = useState<VendorType>(vendorTypes[0]);
  const [services, setServices] = useState<VendorServiceSlug[]>([]);
  const [state, action, pending] = useActionState(createVendorAccount, undefined);

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      setServices([]);
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function toggleService(slug: VendorServiceSlug) {
    setServices((current) => (current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]));
  }

  function serviceTitles(slugs: string[]) {
    return slugs.map((slug) => vendorServiceOptions.find((o) => o.slug === slug)?.title ?? slug).join(", ");
  }

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Network</p>
          <h1 className="display vendor-page-title">Vendors</h1>
          <p className="vendor-page-lead">Create vendor accounts here — vendors don't sign themselves up. Share the credentials with them directly.</p>
        </div>
        <button type="button" className="btn btn-small" onClick={() => setOpen((v) => !v)}>
          {open ? "Cancel" : "Add vendor"} {!open && <span aria-hidden="true">→</span>}
        </button>
      </div>

      {open && (
        <div className="card vendor-panel">
          <div className="vendor-panel-head">
            <h2 className="display text-lg">New vendor account</h2>
          </div>
          <form className="grid gap-6" action={action}>
            {state && !state.ok && <p className="auth-error">{state.error}</p>}

            <div>
              <span className="vendor-eyebrow">Company information</span>
              <div className="admin-form-grid mt-3">
                <label className="label">Organisation / company name
                  <input className="input" name="name" required placeholder="e.g. Amanah Fulfilment Partners" />
                </label>
                <label className="label">Contact person
                  <input className="input" name="contactPerson" placeholder="Who do we deal with day to day?" />
                </label>
              </div>
              <div className="admin-form-grid mt-4">
                <label className="label">Email
                  <input className="input" type="email" name="email" required placeholder="ops@vendor.example" />
                </label>
                <label className="label">Phone
                  <input className="input" name="phone" required placeholder="+65 8123 4567" />
                </label>
              </div>
              <div className="admin-form-grid mt-4">
                <label className="label">WhatsApp <span className="font-normal text-[var(--muted)]">Optional</span>
                  <input className="input" name="whatsapp" placeholder="+65 8123 4567" />
                </label>
                <label className="label">Country
                  <input className="input" name="country" placeholder="e.g. Indonesia" />
                </label>
              </div>
              <label className="label mt-4">City / address <span className="font-normal text-[var(--muted)]">Optional</span>
                <input className="input" name="cityAddress" placeholder="City or full address" />
              </label>
            </div>

            <label className="label">Password
              <div className="admin-password-row">
                <input className="input" name="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
                <button type="button" className="btn-secondary btn btn-small" onClick={() => setPassword(generatePassword())}>Generate</button>
              </div>
            </label>

            <div>
              <span className="vendor-eyebrow">Services offered</span>
              <label className="label mt-3">Vendor type
                <select className="input" name="vendorType" value={vendorType} onChange={(event) => setVendorType(event.target.value as VendorType)}>
                  {vendorTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <div className="admin-checkbox-group mt-3">
                {vendorServiceOptions.map((option) => (
                  <label key={option.slug} className={`admin-checkbox-pill ${services.includes(option.slug) ? "is-active" : ""}`}>
                    <input
                      type="checkbox"
                      name="services"
                      value={option.slug}
                      checked={services.includes(option.slug)}
                      onChange={() => toggleService(option.slug)}
                    />
                    {option.title}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span className="vendor-eyebrow">Payment information</span>
              <div className="admin-form-grid mt-3">
                <label className="label">Preferred currency
                  <input className="input" name="currency" defaultValue="SGD" placeholder="SGD" />
                </label>
                <label className="label">Bank name
                  <input className="input" name="bankName" placeholder="e.g. DBS Bank" />
                </label>
              </div>
              <div className="admin-form-grid mt-4">
                <label className="label">Account name
                  <input className="input" name="bankAccountName" placeholder="Name on the account" />
                </label>
                <label className="label">Account number
                  <input className="input" name="bankAccountNumber" placeholder="Account number" />
                </label>
              </div>
              <label className="label mt-4">SWIFT code <span className="font-normal text-[var(--muted)]">If applicable</span>
                <input className="input" name="swiftCode" placeholder="e.g. DBSSSGSG" />
              </label>
            </div>

            <label className="label">Internal notes <span className="font-normal text-[var(--muted)]">Optional, admin-only</span>
              <textarea className="input vendor-textarea" name="notes" rows={3} placeholder="Anything worth remembering about this vendor" />
            </label>

            <button type="submit" className="btn" disabled={pending}>{pending ? "Creating…" : "Create vendor account"}</button>
          </form>
        </div>
      )}

      {state?.ok && (
        <div className="card admin-credentials-card">
          <span className="vendor-eyebrow">Account created</span>
          <p className="mt-2 text-sm text-[var(--muted)]">Share these credentials with the vendor — they'll log in at the shared login page.</p>
          <div className="admin-credentials-row"><span>Email</span><strong>{state.email}</strong></div>
          <div className="admin-credentials-row"><span>Password</span><strong>{state.password}</strong></div>
        </div>
      )}

      <div className="card vendor-job-table admin-vendor-table">
        {vendors.length === 0 ? (
          <p className="vendor-empty">No vendors yet — add one above.</p>
        ) : (
          vendors.map((vendor) => (
            <Link key={vendor.id} href={`/admin/vendors/${vendor.id}`} className="admin-list-row">
              <span className="vendor-sidebar-avatar admin-list-avatar">{vendor.display_name.charAt(0)}</span>
              <div className="admin-list-main">
                <strong>{vendor.display_name}</strong>
                <small>{vendor.vendor_type ?? "—"} · {serviceTitles(vendor.services) || "No services set"}</small>
              </div>
              <span className={`vendor-status ${vendor.status === "active" ? "vendor-status-accepted" : "vendor-status-rejected"}`}>
                {vendor.status === "active" ? "Active" : "Suspended"}
              </span>
              <div className="admin-list-stats">
                <span>{vendor.jobsCompleted} completed</span>
                <span>{vendor.jobsActive} active</span>
              </div>
              <span className="vendor-job-table-view">View <span aria-hidden="true">→</span></span>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
