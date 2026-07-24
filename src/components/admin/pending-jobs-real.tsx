"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { adminFilters, adminOrderStatusLabel, adminStatusPillVariant } from "@/lib/admin-orders";
import { formatCents, orderTitle, type OrderRow } from "@/lib/orders";
import { broadcastOrderAction } from "@/app/admin/actions";

export interface AdminOrderRow extends OrderRow {
  customer_name: string;
  assigned_vendor?: { display_name: string } | null;
}

export function PendingJobsReal({ orders }: { orders: AdminOrderRow[] }) {
  const [active, setActive] = useState(adminFilters[0]);
  const [pending, startTransition] = useTransition();
  const [broadcastingId, setBroadcastingId] = useState<string | null>(null);

  const needsBroadcastCount = orders.filter((o) => o.status === "submitted").length;
  const visible = active.statuses ? orders.filter((o) => active.statuses!.includes(o.status)) : orders;
  const sorted = [...visible].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  function handleBroadcast(id: string) {
    setBroadcastingId(id);
    startTransition(async () => {
      await broadcastOrderAction(id);
      setBroadcastingId(null);
    });
  }

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Operations</p>
          <h1 className="display vendor-page-title">Pending jobs</h1>
          <p className="vendor-page-lead">New Korban and Wakaf orders land here first — broadcast each one to eligible vendors.</p>
        </div>
      </div>

      {needsBroadcastCount > 0 && (
        <div className="admin-banner">
          <div>
            <strong>{needsBroadcastCount} job{needsBroadcastCount === 1 ? "" : "s"} need{needsBroadcastCount === 1 ? "s" : ""} broadcasting</strong>
            <p>Review each order, then broadcast it to every vendor who offers that service.</p>
          </div>
        </div>
      )}

      <div className="vendor-filter-tabs">
        {adminFilters.map((f) => (
          <button key={f.label} type="button" className={`catalog-tab ${active.label === f.label ? "is-active" : ""}`} onClick={() => setActive(f)}>
            {f.label}
          </button>
        ))}
        <span className="catalog-count ml-auto self-center">{sorted.length} job{sorted.length === 1 ? "" : "s"}</span>
      </div>

      <div className="card vendor-job-table">
        {sorted.length === 0 ? (
          <p className="vendor-empty">No jobs in this view.</p>
        ) : (
          sorted.map((order) => (
            <div key={order.id} className="vendor-job-table-row">
              <Link href={`/admin/jobs/${order.id}`} className="vendor-job-table-main">
                <span className="vendor-job-table-category">{order.service_type}</span>
                <strong>{orderTitle(order)}</strong>
                <small>{order.reference} · {order.customer_name}</small>
              </Link>

              <div className="vendor-job-table-price">
                <strong className="numeral">{formatCents(order.total_amount)}</strong>
              </div>

              <div className="vendor-job-table-status">
                <span className={`vendor-status vendor-status-${adminStatusPillVariant(order.status)}`}>
                  {adminOrderStatusLabel[order.status]}
                </span>
                {order.assigned_vendor && <span className="vendor-countdown">{order.assigned_vendor.display_name}</span>}
              </div>

              {order.status === "submitted" ? (
                <button
                  type="button"
                  className="btn-secondary btn btn-small"
                  disabled={pending && broadcastingId === order.id}
                  onClick={() => handleBroadcast(order.id)}
                >
                  {pending && broadcastingId === order.id ? "Broadcasting…" : "Broadcast"}
                </button>
              ) : (
                <Link href={`/admin/jobs/${order.id}`} className="vendor-job-table-view">View <span aria-hidden="true">→</span></Link>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
