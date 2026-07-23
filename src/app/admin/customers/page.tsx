"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminData } from "@/components/admin/admin-data-context";
import { customerStateLabels, type AdminCustomer } from "@/lib/admin-demo";

const tabs: { label: string; state: AdminCustomer["state"] | null }[] = [
  { label: "All", state: null },
  { label: "Verified", state: "verified" },
  { label: "Pending confirmation", state: "pending" },
  { label: "Suspended", state: "suspended" },
];

export default function AdminCustomersPage() {
  const { customers } = useAdminData();
  const [active, setActive] = useState(tabs[0]);

  const visible = active.state ? customers.filter((c) => c.state === active.state) : customers;

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
        {visible.map((customer) => (
          <Link key={customer.id} href={`/admin/customers/${customer.id}`} className="admin-list-row">
            <span className="vendor-sidebar-avatar admin-list-avatar">{customer.name.charAt(0)}</span>
            <div className="admin-list-main">
              <strong>{customer.name}</strong>
              <small>{customer.email} · {customer.phone}</small>
            </div>
            <span className={`vendor-status ${customer.state === "verified" ? "vendor-status-accepted" : customer.state === "pending" ? "vendor-status-pending" : "vendor-status-rejected"}`}>
              {customerStateLabels[customer.state]}
            </span>
            <div className="admin-list-stats">
              <span>{customer.ordersCount} order{customer.ordersCount === 1 ? "" : "s"}</span>
              <span>S${customer.lifetimeSpend.toLocaleString()} lifetime</span>
            </div>
            <span className="vendor-job-table-view">View <span aria-hidden="true">→</span></span>
          </Link>
        ))}
      </div>
    </>
  );
}
