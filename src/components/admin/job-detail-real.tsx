"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { adminOrderStatusLabel, adminStatusPillVariant } from "@/lib/admin-orders";
import { formatCents, orderTitle, type OrderRow } from "@/lib/orders";
import { broadcastOrderAction, completeOrderAction } from "@/app/admin/actions";

export interface AdminOrderDetail extends OrderRow {
  customer_name: string;
  customer_phone: string;
  assigned_vendor: { id: string; display_name: string; phone: string | null } | null;
}

export interface JobOfferRow {
  id: string;
  status: string;
  expires_at: string;
  vendor: { id: string; display_name: string } | null;
}

export interface ProofRow {
  id: string;
  media_type: string;
  caption: string | null;
  url: string | null;
}

export function JobDetailReal({ order, offers, proofs }: { order: AdminOrderDetail; offers: JobOfferRow[]; proofs: ProofRow[] }) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function broadcast() {
    setBusy(true);
    setError(null);
    startTransition(async () => {
      const res = await broadcastOrderAction(order.id);
      if (!res.ok) setError(res.error ?? "Couldn't broadcast this order.");
      setBusy(false);
    });
  }

  function complete() {
    setBusy(true);
    setError(null);
    startTransition(async () => {
      const res = await completeOrderAction(order.id);
      if (!res.ok) setError(res.error ?? "Couldn't mark this order completed.");
      setBusy(false);
    });
  }

  return (
    <>
      <nav className="breadcrumb">
        <Link href="/admin">Pending jobs</Link>
        <span aria-hidden="true">/</span>
        <span>{orderTitle(order)}</span>
      </nav>

      <div className="vendor-detail-layout mt-6">
        <div className="card vendor-panel">
          <div className="vendor-detail-head">
            <div>
              <span className="vendor-job-table-category">{order.service_type}</span>
              <h1 className="display vendor-page-title mt-2">{orderTitle(order)}</h1>
              <p className="vendor-page-lead">{order.reference} · {formatCents(order.total_amount)}</p>
            </div>
            <span className={`vendor-status vendor-status-${adminStatusPillVariant(order.status)}`}>
              {adminOrderStatusLabel[order.status]}
            </span>
          </div>

          {order.participant_names?.length > 0 && (
            <div className="mt-6">
              <span className="label mb-2 block">Participant{order.participant_names.length > 1 ? "s" : ""}</span>
              <p className="text-sm text-[var(--muted)]">{order.participant_names.join(", ")}</p>
            </div>
          )}
          {order.dedication && (
            <div className="mt-6">
              <span className="label mb-2 block">Dedication</span>
              <p className="text-sm text-[var(--muted)]">{order.dedication}</p>
            </div>
          )}

          {order.status === "broadcasting" && (
            <div className="mt-8">
              <span className="label mb-3 block">Offered to</span>
              {offers.length === 0 ? (
                <p className="vendor-empty">No eligible vendors were found for this category.</p>
              ) : (
                <div className="vendor-report-list">
                  {offers.map((offer) => (
                    <div key={offer.id} className="vendor-report-item">
                      <div className="vendor-report-item-head">
                        <strong>{offer.vendor?.display_name ?? "Unknown vendor"}</strong>
                        <span className={`vendor-status vendor-status-${offer.status === "claimed" ? "accepted" : offer.status === "expired" ? "rejected" : "pending"}`}>
                          {offer.status}
                        </span>
                      </div>
                      <small>Expires {new Date(offer.expires_at).toLocaleString()}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(order.status === "proof_submitted" || order.status === "completed") && (
            <div className="mt-8">
              <span className="label mb-3 block">Submitted evidence</span>
              {proofs.length === 0 ? (
                <p className="vendor-empty">No evidence recorded.</p>
              ) : (
                <div className="admin-proof-grid">
                  {proofs.map((proof) => (
                    <a key={proof.id} href={proof.url ?? undefined} target="_blank" rel="noreferrer" className="admin-proof-tile">
                      {proof.media_type === "video" ? "🎥 Video" : "🖼️ Photo"}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card vendor-panel vendor-buy-box">
          <span className="vendor-eyebrow">Customer</span>
          <strong className="display text-lg mt-2 block">{order.customer_name}</strong>
          <dl className="admin-contact-facts">
            <div><dt>Phone</dt><dd>{order.customer_phone}</dd></div>
            <div><dt>Submitted</dt><dd>{new Date(order.created_at).toLocaleDateString()}</dd></div>
          </dl>

          {error && <p className="auth-error mt-4">{error}</p>}

          {order.status === "submitted" && (
            <button type="button" className="btn mt-6" disabled={pending && busy} onClick={broadcast}>
              {pending && busy ? "Broadcasting…" : "Broadcast to vendors"} <span aria-hidden="true">→</span>
            </button>
          )}

          {order.assigned_vendor && (
            <div className="mt-6">
              <p className="vendor-empty">Assigned to <strong>{order.assigned_vendor.display_name}</strong>.</p>
              <Link href={`/admin/vendors/${order.assigned_vendor.id}`} className="vendor-job-table-view">View vendor <span aria-hidden="true">→</span></Link>
            </div>
          )}

          {order.status === "proof_submitted" && (
            <button type="button" className="btn mt-6" disabled={pending && busy} onClick={complete}>
              {pending && busy ? "Marking completed…" : "Mark completed"} <span aria-hidden="true">→</span>
            </button>
          )}

          {order.status === "completed" && <p className="vendor-empty mt-6">Completed. No further action needed.</p>}
          {order.status === "expired_unclaimed" && (
            <button type="button" className="btn mt-6" disabled={pending && busy} onClick={broadcast}>
              {pending && busy ? "Re-broadcasting…" : "Re-broadcast to vendors"} <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
