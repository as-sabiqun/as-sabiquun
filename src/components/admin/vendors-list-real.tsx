"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { vendorServiceOptions } from "@/lib/vendor-options";
import { createVendorAccount } from "@/app/admin/vendors/actions";

export interface VendorRow {
  id: string;
  display_name: string;
  phone: string | null;
  vendor_type: string | null;
  services: string[];
  status: "active" | "suspended";
  vendor_onboarding_status?: "not_applicable" | "invited" | "pending" | "approved" | "rejected";
  jobsCompleted: number;
  jobsActive: number;
}

export function VendorsListReal({ vendors }: { vendors: VendorRow[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createVendorAccount, undefined);

  function serviceTitles(slugs: string[]) {
    return slugs.map((slug) => vendorServiceOptions.find((o) => o.slug === slug)?.title ?? slug).join(", ");
  }

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Network</p>
          <h1 className="display vendor-page-title">Vendors</h1>
          <p className="vendor-page-lead">Invite fulfilment partners securely. They choose their own password and remain pending until approved.</p>
        </div>
        <button type="button" className="btn btn-small" onClick={() => setOpen((v) => !v)}>
          {open ? "Cancel" : "Add vendor"} {!open && <span aria-hidden="true">→</span>}
        </button>
      </div>

      {open && (
        <div className="card vendor-panel">
          <div className="vendor-panel-head">
            <h2 className="display text-lg">Invite a fulfilment partner</h2>
          </div>
          <form className="grid gap-6" action={action}>
            {state && !state.ok && <p className="auth-error">{state.error}</p>}

            <p className="text-sm text-[var(--muted)]">The partner will securely add their contact, service-region, capability, and bank details during onboarding.</p>
            <div className="admin-form-grid">
              <label className="label">Organisation / company name
                <input className="input" name="name" required maxLength={200} placeholder="e.g. Amanah Fulfilment Partners" />
              </label>
              <label className="label">Invitation email
                <input className="input" type="email" name="email" required maxLength={254} autoComplete="email" placeholder="ops@vendor.example" />
              </label>
            </div>

            <label className="label">Internal notes <span className="font-normal text-[var(--muted)]">Optional, admin-only</span>
              <textarea className="input vendor-textarea" name="notes" rows={3} maxLength={2000} placeholder="Anything worth remembering about this vendor" />
            </label>

            <button type="submit" className="btn" disabled={pending}>{pending ? "Sending…" : "Send secure invitation"}</button>
          </form>
        </div>
      )}

      {state?.ok && (
        <div className="card admin-credentials-card">
          <span className="vendor-eyebrow">Invitation sent</span>
          <p className="mt-2 text-sm text-[var(--muted)]">The partner will choose a password from the email invitation. Approve the account after their setup is complete.</p>
          <div className="admin-credentials-row"><span>Email</span><strong>{state.email}</strong></div>
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
              <span className={`vendor-status ${vendor.status === "suspended" || vendor.vendor_onboarding_status === "rejected" ? "vendor-status-rejected" : vendor.vendor_onboarding_status === "approved" || !vendor.vendor_onboarding_status ? "vendor-status-accepted" : "vendor-status-pending"}`}>
                {vendor.status === "suspended" ? "Suspended" : vendor.vendor_onboarding_status === "approved" || !vendor.vendor_onboarding_status ? "Active" : vendor.vendor_onboarding_status === "invited" ? "Invited" : vendor.vendor_onboarding_status === "pending" ? "Pending approval" : "Rejected"}
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
