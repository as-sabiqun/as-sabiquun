"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { adminOrderStatusLabel, adminStatusPillVariant } from "@/lib/admin-orders";
import { formatCents, orderTitle, type OrderRow } from "@/lib/orders";
import { broadcastOrderAction, reviewProofAction } from "@/app/admin/actions";

export interface AdminOrderDetail extends OrderRow {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  assigned_vendor: { id: string; display_name: string; phone: string | null } | null;
  beneficiary_country: string | null;
  beneficiary_state: string | null;
  beneficiary_village: string | null;
  partner_organisation: string | null;
  beneficiary_names: string[];
  dedication_arabic: string | null;
  dedication_remarks: string | null;
  project_country: string | null;
  project_state: string | null;
  project_village: string | null;
  project_address: string | null;
  project_lat: number | null;
  project_lng: number | null;
  project_maps_link: string | null;
  vendor_remarks: string | null;
  accepted_at: string | null;
  proof_submitted_at: string | null;
  completed_at: string | null;
  admin_verified_by: string | null;
  admin_verified_at: string | null;
  admin_verification_notes: string | null;
  admin_verification_status: "approved" | "rejected" | null;
  admin_verifier_name: string | null;
  email_sent_at: string | null;
  telegram_sent_at: string | null;
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
  category: string | null;
  url: string | null;
}

export interface PaymentSummary {
  payable: number;
  paid: number;
}

const CATEGORY_LABEL: Record<string, string> = {
  before_photo: "Before", during_photo: "During", after_photo: "After",
  before_video: "Before (video)", during_video: "During (video)", after_video: "After (video)", dua_video: "Du'a video",
};

export function JobDetailReal({
  order,
  offers,
  proofs,
  payments,
}: {
  order: AdminOrderDetail;
  offers: JobOfferRow[];
  proofs: ProofRow[];
  payments: PaymentSummary;
}) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  function broadcast() {
    setBusy(true);
    setError(null);
    startTransition(async () => {
      const res = await broadcastOrderAction(order.id);
      if (!res.ok) setError(res.error ?? "Couldn't broadcast this order.");
      setBusy(false);
    });
  }

  function review(approved: boolean) {
    setBusy(true);
    setError(null);
    startTransition(async () => {
      const res = await reviewProofAction(order.id, approved, reviewNotes);
      if (!res.ok) setError(res.error ?? "Couldn't record this review.");
      setBusy(false);
    });
  }

  const timeline: { label: string; at: string }[] = [
    { label: "Job created", at: order.created_at },
    ...(order.accepted_at ? [{ label: "Vendor accepted", at: order.accepted_at }] : []),
    ...(order.proof_submitted_at ? [{ label: "Evidence submitted", at: order.proof_submitted_at }] : []),
    ...(order.admin_verified_at ? [{ label: order.admin_verification_status === "approved" ? "Admin approved" : "Admin requested changes", at: order.admin_verified_at }] : []),
    ...(order.completed_at ? [{ label: "Job completed", at: order.completed_at }] : []),
    ...(order.email_sent_at ? [{ label: "Customer email sent", at: order.email_sent_at }] : []),
    ...(order.telegram_sent_at ? [{ label: "Customer Telegram sent", at: order.telegram_sent_at }] : []),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  const groupedProofs = proofs.reduce<Record<string, ProofRow[]>>((acc, p) => {
    const key = p.category ?? "other";
    (acc[key] ??= []).push(p);
    return acc;
  }, {});

  const hasBeneficiaryInfo = order.beneficiary_country || order.beneficiary_village || order.partner_organisation || order.beneficiary_names.length > 0;
  const hasProjectLocation = order.project_country || order.project_village;
  const outstanding = payments.payable - payments.paid;

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
          {(order.dedication || order.dedication_arabic || order.dedication_remarks) && (
            <div className="mt-6">
              <span className="label mb-2 block">Dedication</span>
              {order.dedication && <p className="text-sm text-[var(--muted)]">{order.dedication}</p>}
              {order.dedication_arabic && <p className="text-sm text-[var(--muted)]" dir="rtl">{order.dedication_arabic}</p>}
              {order.dedication_remarks && <p className="mt-1 text-xs text-[var(--muted)]">{order.dedication_remarks}</p>}
            </div>
          )}

          {hasBeneficiaryInfo && (
            <div className="mt-6">
              <span className="label mb-2 block">Beneficiary</span>
              <dl className="admin-contact-facts">
                {order.beneficiary_country && <div><dt>Country</dt><dd>{order.beneficiary_country}</dd></div>}
                {order.beneficiary_state && <div><dt>State / province</dt><dd>{order.beneficiary_state}</dd></div>}
                {order.beneficiary_village && <div><dt>Village</dt><dd>{order.beneficiary_village}</dd></div>}
                {order.partner_organisation && <div><dt>Partner org</dt><dd>{order.partner_organisation}</dd></div>}
                {order.beneficiary_names.length > 0 && <div><dt>Beneficiaries</dt><dd>{order.beneficiary_names.join(", ")}</dd></div>}
              </dl>
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

          {hasProjectLocation && (
            <div className="mt-8">
              <span className="label mb-2 block">Project location</span>
              <dl className="admin-contact-facts">
                {order.project_country && <div><dt>Country</dt><dd>{order.project_country}</dd></div>}
                {order.project_state && <div><dt>State / province</dt><dd>{order.project_state}</dd></div>}
                {order.project_village && <div><dt>Village</dt><dd>{order.project_village}</dd></div>}
                {order.project_address && <div><dt>Address</dt><dd>{order.project_address}</dd></div>}
                {order.project_lat && order.project_lng && <div><dt>GPS</dt><dd>{order.project_lat}, {order.project_lng}</dd></div>}
              </dl>
              {order.project_maps_link && <a href={order.project_maps_link} target="_blank" rel="noreferrer" className="vendor-job-table-view mt-2 inline-block">View on Google Maps <span aria-hidden="true">→</span></a>}
            </div>
          )}

          {proofs.length > 0 && (
            <div className="mt-8">
              <span className="label mb-3 block">Completion evidence</span>
              {Object.entries(groupedProofs).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <span className="text-xs font-bold text-[var(--muted)]">{CATEGORY_LABEL[category] ?? category}</span>
                  <div className="admin-proof-grid mt-2">
                    {items.map((proof) => (
                      <a key={proof.id} href={proof.url ?? undefined} target="_blank" rel="noreferrer" className="admin-proof-tile">
                        {proof.media_type === "video" ? "🎥 Video" : "🖼️ Photo"}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {order.vendor_remarks && (
            <div className="mt-6">
              <span className="label mb-2 block">Vendor remarks</span>
              <p className="text-sm text-[var(--muted)]">{order.vendor_remarks}</p>
            </div>
          )}

          {order.status === "proof_submitted" && (
            <div className="mt-8">
              <span className="label mb-2 block">Admin verification</span>
              <textarea className="input vendor-textarea" rows={3} placeholder="Notes (required if requesting changes)" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} />
              <div className="flex gap-3 mt-3">
                <button type="button" className="btn" disabled={pending && busy} onClick={() => review(true)}>{pending && busy ? "Saving…" : "Approve"}</button>
                <button type="button" className="btn-secondary btn" disabled={(pending && busy) || !reviewNotes.trim()} onClick={() => review(false)}>Request changes</button>
              </div>
            </div>
          )}

          {order.admin_verification_status && (
            <div className="mt-6">
              <span className="label mb-2 block">Verification record</span>
              <p className="text-sm text-[var(--muted)]">
                {order.admin_verification_status === "approved" ? "Approved" : "Changes requested"} by {order.admin_verifier_name ?? "admin"} on {order.admin_verified_at && new Date(order.admin_verified_at).toLocaleString()}
                {order.admin_verification_notes && ` — "${order.admin_verification_notes}"`}
              </p>
            </div>
          )}

          {timeline.length > 1 && (
            <div className="mt-8">
              <span className="label mb-3 block">Audit timeline</span>
              <div className="vendor-job-list">
                {timeline.map((event) => (
                  <div key={event.label} className="vendor-job-row" style={{ cursor: "default" }}>
                    <strong>{event.label}</strong>
                    <small>{new Date(event.at).toLocaleString()}</small>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card vendor-panel vendor-buy-box">
          <span className="vendor-eyebrow">Customer</span>
          <strong className="display text-lg mt-2 block">{order.customer_name}</strong>
          <dl className="admin-contact-facts">
            <div><dt>Email</dt><dd>{order.customer_email}</dd></div>
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

          {order.status === "expired_unclaimed" && (
            <button type="button" className="btn mt-6" disabled={pending && busy} onClick={broadcast}>
              {pending && busy ? "Re-broadcasting…" : "Re-broadcast to vendors"} <span aria-hidden="true">→</span>
            </button>
          )}

          {["assigned", "in_progress", "completed", "revision_required"].includes(order.status) && (
            <div className="mt-6">
              <span className="vendor-eyebrow">Vendor payment</span>
              <dl className="admin-contact-facts mt-3">
                <div><dt>Payable</dt><dd>{formatCents(payments.payable)}</dd></div>
                <div><dt>Paid</dt><dd>{formatCents(payments.paid)}</dd></div>
                <div><dt>Outstanding</dt><dd style={outstanding > 0 ? { color: "#b3402f" } : undefined}>{formatCents(outstanding)}</dd></div>
              </dl>
            </div>
          )}

          {order.status === "completed" && (
            <div className="mt-6">
              <span className="vendor-eyebrow">Customer notification</span>
              <dl className="admin-contact-facts mt-3">
                <div><dt>Email</dt><dd>{order.email_sent_at ? new Date(order.email_sent_at).toLocaleDateString() : "Not sent yet"}</dd></div>
                <div><dt>Telegram</dt><dd>{order.telegram_sent_at ? new Date(order.telegram_sent_at).toLocaleDateString() : "Not sent yet"}</dd></div>
              </dl>
              <p className="text-xs text-[var(--muted)] mt-2">Notification sending isn't wired up yet.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
