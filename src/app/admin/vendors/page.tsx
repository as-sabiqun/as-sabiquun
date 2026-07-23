"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useAdminData } from "@/components/admin/admin-data-context";
import { generatePassword } from "@/lib/admin-demo";
import { createVendorAccount } from "./actions";

export default function AdminVendorsPage() {
  const { vendors, addVendor } = useAdminData();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState(generatePassword());
  const [lastName, setLastName] = useState("");
  const [lastPhone, setLastPhone] = useState("");
  const [state, action, pending] = useActionState(createVendorAccount, undefined);

  useEffect(() => {
    if (state?.ok) {
      addVendor({ name: lastName || state.email.split("@")[0], email: state.email, phone: lastPhone });
      setOpen(false);
    }
    // Only run when a new submission result arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function handleSubmit(formData: FormData) {
    setLastName(String(formData.get("name") ?? ""));
    setLastPhone(String(formData.get("phone") ?? ""));
    action(formData);
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
          <form className="grid gap-5" action={handleSubmit}>
            {state && !state.ok && <p className="auth-error">{state.error}</p>}

            <div className="admin-form-grid">
              <label className="label">Full name / business name
                <input className="input" name="name" required placeholder="e.g. Amanah Fulfilment Partners" />
              </label>
              <label className="label">Phone
                <input className="input" name="phone" required placeholder="+65 8123 4567" />
              </label>
            </div>
            <label className="label">Email
              <input className="input" type="email" name="email" required placeholder="ops@vendor.example" />
            </label>
            <label className="label">Password
              <div className="admin-password-row">
                <input className="input" name="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
                <button type="button" className="btn-secondary btn btn-small" onClick={() => setPassword(generatePassword())}>Generate</button>
              </div>
            </label>

            <button type="submit" className="btn" disabled={pending}>{pending ? "Creating…" : "Create vendor account"}</button>
          </form>
        </div>
      )}

      {state?.ok && (
        <div className="card admin-credentials-card">
          <span className="vendor-eyebrow">{state.live ? "Account created" : "Preview only — not saved"}</span>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {state.live
              ? "Share these credentials with the vendor — they'll log in at the shared login page."
              : "Supabase isn't connected yet, so no real account was created. Once connected, this will create a working login."}
          </p>
          <div className="admin-credentials-row"><span>Email</span><strong>{state.email}</strong></div>
          <div className="admin-credentials-row"><span>Password</span><strong>{state.password}</strong></div>
        </div>
      )}

      <div className="card vendor-job-table admin-vendor-table">
        {vendors.map((vendor) => (
          <Link key={vendor.id} href={`/admin/vendors/${vendor.id}`} className="admin-list-row">
            <span className="vendor-sidebar-avatar admin-list-avatar">{vendor.name.charAt(0)}</span>
            <div className="admin-list-main">
              <strong>{vendor.name}</strong>
              <small>{vendor.email} · {vendor.phone || "No phone on file"}</small>
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
        ))}
      </div>
    </>
  );
}
