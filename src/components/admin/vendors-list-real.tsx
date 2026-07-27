"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { vendorDirectoryState } from "@/lib/vendor-directory";
import { vendorServiceOptions } from "@/lib/vendor-options";
import { createVendorAccount } from "@/app/admin/vendors/actions";

export interface VendorRow {
  id: string;
  display_name: string;
  contact_person: string | null;
  phone: string | null;
  country: string | null;
  city_address: string | null;
  vendor_type: string | null;
  services: string[];
  status: "active" | "suspended";
  vendor_onboarding_status?: "not_applicable" | "invited" | "pending" | "approved" | "rejected";
  rating: number | null;
  jobsCompleted: number;
  jobsActive: number;
}

type VendorFilter = "all" | "operational" | "pending" | "invited" | "paused";

const filters: { value: VendorFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "operational", label: "Active" },
  { value: "pending", label: "Pending approval" },
  { value: "invited", label: "Invited" },
  { value: "paused", label: "Paused" },
];

const mvpServices = vendorServiceOptions.filter(({ slug }) => ["korban", "water", "quran", "orphans"].includes(slug));

function stateLabel(vendor: VendorRow) {
  const state = vendorDirectoryState(vendor);
  if (state === "operational") return "Active";
  if (state === "pending") return "Pending approval";
  if (state === "invited") return "Invited";
  return vendor.status === "suspended" ? "Suspended" : "Rejected";
}

export function VendorsListReal({ vendors }: { vendors: VendorRow[] }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<VendorFilter>("all");
  const [query, setQuery] = useState("");
  const [state, action, pending] = useActionState(createVendorAccount, undefined);

  const normalizedQuery = query.trim().toLowerCase();
  const visible = vendors.filter((vendor) => {
    const serviceNames = vendor.services.map((slug) => vendorServiceOptions.find((option) => option.slug === slug)?.title ?? slug);
    return (filter === "all" || vendorDirectoryState(vendor) === filter)
      && (!normalizedQuery || [vendor.display_name, vendor.contact_person, vendor.phone, vendor.country, vendor.city_address, vendor.vendor_type, ...serviceNames]
        .some((value) => value?.toLowerCase().includes(normalizedQuery)));
  });
  const operational = vendors.filter((vendor) => vendorDirectoryState(vendor) === "operational").length;
  const onboarding = vendors.filter((vendor) => ["pending", "invited"].includes(vendorDirectoryState(vendor))).length;
  const activeJobs = vendors.reduce((total, vendor) => total + vendor.jobsActive, 0);

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Network</p>
          <h1 className="display vendor-page-title">Vendors</h1>
          <p className="vendor-page-lead">Manage the vendors trusted to carry out each project and submit completed work.</p>
        </div>
        <button type="button" className="btn btn-small" onClick={() => setOpen((value) => !value)}>
          {open ? "Cancel" : "Add vendor"} {!open && <span aria-hidden="true">→</span>}
        </button>
      </div>

      {open && (
        <div className="card vendor-panel admin-vendor-invite">
          <div className="vendor-panel-head"><h2 className="display text-lg">Invite a vendor</h2></div>
          <form className="grid gap-6" action={action}>
            {state && !state.ok && <p className="auth-error">{state.error}</p>}
            <p className="text-sm text-[var(--muted)]">The vendor will securely add their contact, service areas, available services, and bank details during setup.</p>
            <div className="admin-form-grid">
              <label className="label">Organisation / company name
                <input className="input" name="name" required maxLength={200} placeholder="e.g. Amanah Service Partners" />
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

      <section className="admin-network-overview" aria-label="Vendor network summary">
        <div className="admin-network-total">
          <span>Vendor network</span>
          <strong className="display numeral">{vendors.length.toString().padStart(2, "0")}</strong>
          <p>partner{vendors.length === 1 ? "" : "s"} recorded</p>
        </div>
        <dl className="admin-network-facts">
          <div><dt>Active vendors</dt><dd>{operational}</dd></div>
          <div><dt>Still setting up</dt><dd>{onboarding}</dd></div>
          <div><dt>Ongoing projects</dt><dd>{activeJobs}</dd></div>
        </dl>
        <div className="admin-capability-wrap">
          <div className="admin-capability-head"><span>Services covered</span><small>Approved, active vendors</small></div>
          <div className="admin-capability-grid">
            {mvpServices.map((service, index) => {
              const count = vendors.filter((vendor) => vendorDirectoryState(vendor) === "operational" && vendor.services.includes(service.slug)).length;
              return <div key={service.slug} data-service={service.slug}><span>{String(index + 1).padStart(2, "0")}</span><strong>{service.title}</strong><small>{count} ready</small></div>;
            })}
          </div>
        </div>
      </section>

      <section className="admin-directory" aria-labelledby="vendor-directory-title">
        <div className="admin-directory-head">
          <div><span className="vendor-eyebrow">Directory</span><h2 id="vendor-directory-title">Partner records</h2></div>
          <label className="admin-directory-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <span className="sr-only">Search vendors</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search name, region, service..." />
          </label>
        </div>
        <div className="admin-directory-filters" aria-label="Filter vendors">
          {filters.map((item) => {
            const count = vendors.filter((vendor) => item.value === "all" || vendorDirectoryState(vendor) === item.value).length;
            return <button key={item.value} type="button" className={filter === item.value ? "is-active" : ""} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}<span>{count}</span></button>;
          })}
          <small>{visible.length} shown</small>
        </div>

        <div className="admin-partner-table">
          <div className="admin-partner-table-head" aria-hidden="true">
            <span>Vendor</span><span>Services</span><span>Status</span><span>Projects</span><span />
          </div>
          {visible.length === 0 ? (
            <div className="admin-directory-empty">
              <strong>{vendors.length === 0 ? "No vendors yet" : "No matching vendors"}</strong>
              <p>{vendors.length === 0 ? "Invite your first vendor to begin building the network." : "Change the filter or search phrase to see other records."}</p>
            </div>
          ) : visible.map((vendor, index) => (
            <Link key={vendor.id} href={`/admin/vendors/${vendor.id}`} className="admin-partner-row">
              <div className="admin-partner-identity">
                <span className="admin-partner-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="vendor-sidebar-avatar admin-list-avatar">{vendor.display_name.charAt(0)}</span>
                <div><strong>{vendor.display_name}</strong><small>{[vendor.country || vendor.city_address, vendor.contact_person || vendor.phone].filter(Boolean).join(" · ") || "Contact details pending"}</small></div>
              </div>
              <div className="admin-partner-capabilities">
                {vendor.services.length ? vendor.services.slice(0, 3).map((slug) => <span key={slug} data-service={slug}>{vendorServiceOptions.find((option) => option.slug === slug)?.title ?? slug}</span>) : <small>No services selected</small>}
                {vendor.services.length > 3 && <small>+{vendor.services.length - 3} more</small>}
              </div>
              <div className="admin-partner-state">
                <span className={`vendor-status ${vendorDirectoryState(vendor) === "operational" ? "vendor-status-accepted" : vendorDirectoryState(vendor) === "paused" ? "vendor-status-rejected" : "vendor-status-pending"}`}>{stateLabel(vendor)}</span>
                {vendor.rating != null && <small>{vendor.rating.toFixed(1)} / 5 rating</small>}
              </div>
              <div className="admin-partner-workload"><strong>{vendor.jobsActive}</strong><span>active</span><small>{vendor.jobsCompleted} completed</small></div>
              <span className="admin-partner-open" aria-label={`Open ${vendor.display_name}`}>→</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
