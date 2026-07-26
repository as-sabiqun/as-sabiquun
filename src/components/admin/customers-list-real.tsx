"use client";

import Link from "next/link";
import { useState } from "react";
import { customerDirectoryState, customerDirectorySummary, type CustomerDirectoryRecord, type CustomerDirectoryState } from "@/lib/customer-directory";
import { formatCents } from "@/lib/orders";

export interface CustomerRow extends CustomerDirectoryRecord {
  id: string;
  display_name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  latestOrderAt: string | null;
  ordersCount: number;
}

type CustomerFilter = "all" | CustomerDirectoryState;

const filters: Array<{ value: CustomerFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "ready", label: "Checkout ready" },
  { value: "needs_setup", label: "Needs setup" },
  { value: "suspended", label: "Suspended" },
];

function stateLabel(customer: CustomerRow) {
  const state = customerDirectoryState(customer);
  if (state === "ready") return "Ready";
  if (state === "suspended") return "Suspended";
  return "Needs setup";
}

function stateVariant(customer: CustomerRow) {
  const state = customerDirectoryState(customer);
  if (state === "ready") return "vendor-status-accepted";
  if (state === "suspended") return "vendor-status-rejected";
  return "vendor-status-pending";
}

export function CustomersListReal({ customers }: { customers: CustomerRow[] }) {
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [query, setQuery] = useState("");
  const summary = customerDirectorySummary(customers);
  const normalizedQuery = query.trim().toLowerCase();
  const visible = customers.filter((customer) => (filter === "all" || customerDirectoryState(customer) === filter)
    && (!normalizedQuery || [customer.display_name, customer.email, customer.phone].some((value) => value?.toLowerCase().includes(normalizedQuery))));
  const readiness = [
    { label: "Google email verified", value: summary.verified },
    { label: "Telegram connected", value: summary.telegramLinked },
    { label: "Ready for checkout", value: summary.ready },
  ];

  function filterCount(value: CustomerFilter) {
    return customers.filter((customer) => value === "all" || customerDirectoryState(customer) === value).length;
  }

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Accounts</p>
          <h1 className="display vendor-page-title">Customers</h1>
          <p className="vendor-page-lead">See who is ready to contribute, what is in progress, and where account setup needs attention.</p>
        </div>
      </div>

      <section className="admin-network-overview admin-customer-overview" aria-label="Customer account summary">
        <div className="admin-network-total">
          <span>Customer accounts</span>
          <strong className="display numeral">{customers.length.toString().padStart(2, "0")}</strong>
          <p>registered through the public site</p>
        </div>
        <div className="admin-customer-readiness">
          <div className="admin-customer-summary-head"><span>Account readiness</span><small>Required before payment</small></div>
          {readiness.map((item) => (
            <div className="admin-customer-readiness-row" key={item.label}>
              <div><span>{item.label}</span><strong>{item.value}/{customers.length}</strong></div>
              <span className="admin-customer-readiness-track" aria-hidden="true"><span style={{ width: `${customers.length ? (item.value / customers.length) * 100 : 0}%` }} /></span>
            </div>
          ))}
        </div>
        <div className="admin-customer-activity">
          <div className="admin-customer-summary-head"><span>Customer activity</span><small>Confirmed HitPay projects only</small></div>
          <div className="admin-customer-activity-grid">
            <div><span>Paid projects</span><strong>{summary.paidOrders}</strong></div>
            <div><span>In fulfilment</span><strong>{summary.activeProjects}</strong></div>
            <div><span>Delivered</span><strong>{summary.completedProjects}</strong></div>
            <div><span>Net paid</span><strong>{formatCents(summary.lifetimeSpendCents)}</strong></div>
          </div>
        </div>
      </section>

      <section className="admin-directory" aria-labelledby="customer-directory-title">
        <div className="admin-directory-head">
          <div><span className="vendor-eyebrow">Directory</span><h2 id="customer-directory-title">Customer records</h2></div>
          <label className="admin-directory-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <span className="sr-only">Search customers</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search name, email, phone..." />
          </label>
        </div>
        <div className="admin-directory-filters" aria-label="Filter customers">
          {filters.map((item) => (
            <button key={item.value} type="button" className={filter === item.value ? "is-active" : ""} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>
              {item.label}<span>{filterCount(item.value)}</span>
            </button>
          ))}
          <small>{visible.length} shown</small>
        </div>

        <div className="admin-customer-table">
          <div className="admin-customer-table-head" aria-hidden="true"><span>Customer</span><span>Readiness</span><span>Activity</span><span>Paid value</span><span /></div>
          {visible.length === 0 ? (
            <div className="admin-directory-empty"><strong>{customers.length === 0 ? "No customers yet" : "No matching customers"}</strong><p>{customers.length === 0 ? "Customer records appear after Google sign-in." : "Change the filter or search phrase to see other records."}</p></div>
          ) : visible.map((customer) => (
            <Link key={customer.id} href={`/admin/customers/${customer.id}`} className="admin-customer-row">
              <div className="admin-customer-identity">
                <span className="vendor-sidebar-avatar admin-list-avatar">{customer.display_name.charAt(0)}</span>
                <div><strong>{customer.display_name}</strong><small>{customer.email}</small><small>{customer.phone ?? (customer.latestOrderAt ? `Last activity ${new Date(customer.latestOrderAt).toLocaleDateString("en-SG")}` : `Joined ${new Date(customer.createdAt).toLocaleDateString("en-SG")}`)}</small></div>
              </div>
              <div className="admin-customer-ready-cell">
                <span className={`vendor-status ${stateVariant(customer)}`}>{stateLabel(customer)}</span>
                <small><span className={customer.verified ? "is-connected" : ""}>Email</span><span className={customer.telegramLinked ? "is-connected" : ""}>Telegram</span></small>
              </div>
              <div className="admin-customer-workload"><strong>{customer.activeProjects}</strong><span>active</span><small>{customer.completedProjects} delivered · {customer.ordersCount} total</small></div>
              <div className="admin-customer-value"><strong>{formatCents(customer.lifetimeSpendCents)}</strong><small>{customer.paidOrdersCount} paid project{customer.paidOrdersCount === 1 ? "" : "s"}</small></div>
              <span className="admin-partner-open" aria-label={`Open ${customer.display_name}`}>→</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
