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
  const lifetimeSpend = orders.filter((order) => ["paid", "partially_refunded"].includes(order.payment_status)).reduce((sum, order) => sum + order.total_amount, 0);

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

      <div className="vendor-detail-layout mt-6">
        <div className="card vendor-panel">
          {error && <p className="auth-error mb-4" role="alert">{error}</p>}
          <div className="vendor-detail-head">
            <div>
              <h1 className="display vendor-page-title">{customer.display_name}</h1>
              <p className="vendor-page-lead">Customer since {new Date(customer.created_at).toLocaleDateString()}</p>
            </div>
            <span className={`vendor-status ${customer.status === "suspended" ? "vendor-status-rejected" : customer.verified ? "vendor-status-accepted" : "vendor-status-pending"}`}>
              {customer.status === "suspended" ? "Suspended" : customer.verified ? "Verified" : "Pending confirmation"}
            </span>
          </div>

          <div className="vendor-stat-grid admin-vendor-stats">
            <div className="admin-inline-stat"><span>Orders</span><strong className="numeral">{orders.length}</strong></div>
            <div className="admin-inline-stat"><span>Lifetime spend</span><strong className="numeral">{formatCents(lifetimeSpend)}</strong></div>
          </div>

          <div className="mt-8">
            <span className="label mb-3 block">Order activity</span>
            {orders.length === 0 ? (
              <p className="vendor-empty">No orders yet.</p>
            ) : (
              <div className="vendor-job-list">
                {orders.map((order) => (
                  <Link key={order.id} href={`/admin/jobs/${order.id}`} className="vendor-job-row">
                    <div>
                      <strong>{orderTitle(order)}</strong>
                      <small>{order.reference}</small>
                    </div>
                    <div className="vendor-job-row-meta">
                      <span className={`vendor-status vendor-status-${lifecyclePillVariant(order)}`}>
                        {lifecycleLabel(order)}
                      </span>
                      <strong className="numeral">{formatCents(order.total_amount)}</strong>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="btn btn-secondary btn-small mt-6" disabled={pending} onClick={toggleStatus}>{pending ? "Saving…" : customer.status === "active" ? "Suspend customer access" : "Restore customer access"}</button>
        </div>

        <div className="card vendor-panel">
          <span className="vendor-eyebrow">Contact details</span>
          <dl className="admin-contact-facts mt-3">
            <div><dt>Email</dt><dd>{customer.email}</dd></div>
            <div><dt>Phone</dt><dd>{customer.phone ?? "—"}</dd></div>
            <div><dt>Customer ID</dt><dd>{customer.id}</dd></div>
          </dl>
        </div>
      </div>
    </>
  );
}
