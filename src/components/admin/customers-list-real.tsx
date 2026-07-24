"use client";

import Link from "next/link";
import { useState } from "react";

export interface CustomerRow {
  id: string;
  display_name: string;
  email: string;
  phone: string | null;
  verified: boolean;
  status: "active" | "suspended";
  ordersCount: number;
  lifetimeSpendCents: number;
}

const tabs = [
  { label: "All", filter: (c: CustomerRow) => true },
  { label: "Verified", filter: (c: CustomerRow) => c.verified && c.status === "active" },
  { label: "Pending confirmation", filter: (c: CustomerRow) => !c.verified },
  { label: "Suspended", filter: (c: CustomerRow) => c.status === "suspended" },
];

export function CustomersListReal({ customers }: { customers: CustomerRow[] }) {
  const [active, setActive] = useState(tabs[0]);
  const visible = customers.filter(active.filter);

  function stateLabel(c: CustomerRow) {
    if (c.status === "suspended") return "Suspended";
    return c.verified ? "Verified" : "Pending confirmation";
  }
  function stateVariant(c: CustomerRow) {
    if (c.status === "suspended") return "vendor-status-rejected";
    return c.verified ? "vendor-status-accepted" : "vendor-status-pending";
  }

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Accounts</p>
          <h1 className="display vendor-page-title">Customers</h1>
          <p className="vendor-page-lead">Everyone who has signed up through the public site.</p>
        </div>
      </div>

      <div className="vendor-filter-tabs">
        {tabs.map((tab) => (
          <button key={tab.label} type="button" className={`catalog-tab ${active.label === tab.label ? "is-active" : ""}`} onClick={() => setActive(tab)}>
            {tab.label}
          </button>
        ))}
        <span className="catalog-count ml-auto self-center">{visible.length} customer{visible.length === 1 ? "" : "s"}</span>
      </div>

      <div className="card vendor-job-table admin-vendor-table">
        {visible.length === 0 ? (
          <p className="vendor-empty">No customers in this view.</p>
        ) : (
          visible.map((customer) => (
            <Link key={customer.id} href={`/admin/customers/${customer.id}`} className="admin-list-row">
              <span className="vendor-sidebar-avatar admin-list-avatar">{customer.display_name.charAt(0)}</span>
              <div className="admin-list-main">
                <strong>{customer.display_name}</strong>
                <small>{customer.email} · {customer.phone ?? "No phone on file"}</small>
              </div>
              <span className={`vendor-status ${stateVariant(customer)}`}>{stateLabel(customer)}</span>
              <div className="admin-list-stats">
                <span>{customer.ordersCount} order{customer.ordersCount === 1 ? "" : "s"}</span>
                <span>S${(customer.lifetimeSpendCents / 100).toLocaleString()} lifetime</span>
              </div>
              <span className="vendor-job-table-view">View <span aria-hidden="true">→</span></span>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
