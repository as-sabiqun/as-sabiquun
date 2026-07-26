"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { setCustomerStatusAction } from "@/app/admin/actions";
import { lifecycleLabel, lifecyclePillVariant } from "@/components/admin/operations-jobs";
import type { DeliveryStatus, FulfilmentStatus, PaymentStatus, SettlementStatus } from "@/lib/order-lifecycle";
import { formatCents, orderTitle, type OrderRow } from "@/lib/orders";

export interface CustomerDetail {
  id: string;
  display_name: string;
  email: string;
  phone: string | null;
  verified: boolean;
  status: "active" | "suspended";
  created_at: string;
}

export interface CustomerOrderRow extends OrderRow {
  payment_status: PaymentStatus;
  fulfilment_status: FulfilmentStatus;
  delivery_status: DeliveryStatus;
  settlement_status: SettlementStatus;
}

export function CustomerDetailReal({ customer, orders }: { customer: CustomerDetail; orders: CustomerOrderRow[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const lifetimeSpend = orders.filter((order) => ["paid", "partially_refunded"].includes(order.payment_status)).reduce((sum, order) => sum + order.total_amount, 0);
  const activeProjects = orders.filter((order) => ["paid", "partially_refunded"].includes(order.payment_status) && order.delivery_status !== "delivered" && order.fulfilment_status !== "cancelled").length;
  const deliveredProjects = orders.filter((order) => order.delivery_status === "delivered").length;
  const contactDetails = [
    { key: "email", label: "Email", value: customer.email },
    { key: "phone", label: "Phone", value: customer.phone },
    { key: "id", label: "Customer ID", value: customer.id },
  ];

  async function copyContact(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => current === key ? null : current), 1600);
    } catch {
      setError("This contact detail could not be copied.");
    }
  }

  function toggleStatus() {
    setError(null);
    startTransition(async () => {
      const result = await setCustomerStatusAction(customer.id, customer.status === "active" ? "suspended" : "active");
      if (!result.ok) setError(result.error ?? "The customer status could not be updated.");
    });
  }

  return (
    <>
      <nav className="breadcrumb">
        <Link href="/admin/customers">Customers</Link>
        <span aria-hidden="true">/</span>
        <span>{customer.display_name}</span>
      </nav>

      {error && <p className="auth-error mt-5" role="alert">{error}</p>}

      <section className="admin-customer-profile-hero mt-6" aria-labelledby="customer-name">
        <div className="admin-customer-profile-identity">
          <span className="admin-customer-profile-avatar" aria-hidden="true">{customer.display_name.charAt(0)}</span>
          <div>
            <span className="vendor-eyebrow">Customer record</span>
            <h1 id="customer-name" className="display">{customer.display_name}</h1>
            <p>Joined {new Date(customer.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>
        <span className={`vendor-status ${customer.status === "suspended" ? "vendor-status-rejected" : customer.verified ? "vendor-status-accepted" : "vendor-status-pending"}`}>
          {customer.status === "suspended" ? "Suspended" : customer.verified ? "Verified" : "Pending confirmation"}
        </span>
        <div className="admin-customer-profile-metrics">
          <div><span>Total orders</span><strong className="numeral">{orders.length}</strong></div>
          <div><span>Paid value</span><strong className="numeral">{formatCents(lifetimeSpend)}</strong></div>
          <div><span>Active projects</span><strong className="numeral">{activeProjects}</strong></div>
          <div><span>Delivered</span><strong className="numeral">{deliveredProjects}</strong></div>
        </div>
      </section>

      <div className="admin-customer-profile-layout mt-5">
        <section className="card admin-customer-projects" aria-labelledby="customer-projects-title">
          <header>
            <div>
              <span className="vendor-eyebrow">Activity</span>
              <h2 id="customer-projects-title">Project history</h2>
            </div>
            <span>{orders.length} record{orders.length === 1 ? "" : "s"}</span>
          </header>
          {orders.length === 0 ? (
            <div className="admin-customer-projects-empty">
              <span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M4 7h16v13H4z" /><path d="M4 11h16" /></svg></span>
              <strong>No projects yet</strong>
              <p>Projects will appear here after this customer completes checkout.</p>
            </div>
          ) : (
            <div className="admin-customer-project-list">
              {orders.map((order) => (
                <Link key={order.id} href={`/admin/jobs/${order.id}`} className="admin-customer-project-row">
                  <div><strong>{orderTitle(order)}</strong><small>{order.reference} · {new Date(order.created_at).toLocaleDateString("en-SG")}</small></div>
                  <span className={`vendor-status vendor-status-${lifecyclePillVariant(order)}`}>{lifecycleLabel(order)}</span>
                  <strong className="numeral">{formatCents(order.total_amount)}</strong>
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="card admin-customer-account-panel">
          <header><span className="vendor-eyebrow">Account</span><h2>Customer details</h2></header>
          <section aria-labelledby="customer-contact-title">
            <h3 id="customer-contact-title">Contact</h3>
            <dl className="admin-contact-facts">
            {contactDetails.map((detail) => (
              <div className="admin-copy-fact" key={detail.key}>
                <dt>{detail.label}</dt>
                <dd title={detail.value ?? undefined}>{detail.value ?? "Not provided"}</dd>
                {detail.value && (
                  <button type="button" className={`admin-copy-button ${copied === detail.key ? "is-copied" : ""}`} onClick={() => copyContact(detail.key, detail.value!)} aria-label={`${copied === detail.key ? "Copied" : "Copy"} ${detail.label.toLowerCase()}`}>
                    {copied === detail.key ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
                    )}
                    {copied === detail.key && <span role="status">Copied</span>}
                  </button>
                )}
              </div>
            ))}
            </dl>
          </section>
          <section aria-labelledby="customer-access-title">
            <h3 id="customer-access-title">Access</h3>
            <dl className="admin-customer-access-facts">
              <div><dt>Google email</dt><dd>{customer.verified ? "Verified" : "Unverified"}</dd></div>
              <div><dt>Portal access</dt><dd>{customer.status === "active" ? "Active" : "Suspended"}</dd></div>
            </dl>
          </section>
          <div className="admin-customer-access-action">
            <p>{customer.status === "active" ? "Suspending access signs the customer out and blocks their portal." : "Restore this customer’s access to the portal."}</p>
            <button type="button" className="btn btn-secondary btn-small" disabled={pending} onClick={toggleStatus}>{pending ? "Saving…" : customer.status === "active" ? "Suspend access" : "Restore access"}</button>
          </div>
        </aside>
      </div>
    </>
  );
}
