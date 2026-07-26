"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { broadcastOrderAction, recordCustomerDeliveryAction, reviewProofAction } from "@/app/admin/actions";
import { adminOrderStatusLabel, adminStatusPillVariant } from "@/lib/admin-orders";
import { formatCents, orderTitle, type OrderRow } from "@/lib/orders";

export interface AdminOrderDetail extends OrderRow {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  vendor_payout_amount: number;
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
  broadcast_started_at: string | null;
  accepted_at: string | null;
  proof_submitted_at: string | null;
  completed_at: string | null;
  closed_at: string | null;
  completion_deadline: string | null;
  admin_verified_by: string | null;
  admin_verified_at: string | null;
  admin_verification_notes: string | null;
  admin_verification_status: "approved" | "rejected" | null;
  admin_verifier_name: string | null;
  email_sent_at: string | null;
  email_status: string | null;
  telegram_sent_at: string | null;
  telegram_status: string | null;
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

export interface PaymentRow {
  id: string;
  amount: number;
  payment_date: string;
  method: string | null;
  reference: string | null;
  created_at: string;
}

const evidenceRequirements = [
  ["before_photo", "Before photos", 3],
  ["during_photo", "During photos", 3],
  ["after_photo", "After photos", 3],
  ["before_video", "Before video", 1],
  ["during_video", "During video", 1],
  ["after_video", "After video", 1],
  ["dua_video", "Du'a video", 1],
] as const;

function formatDate(value: string | null, withTime = false) {
  if (!value) return "Not recorded";
  return withTime ? new Date(value).toLocaleString() : new Date(value).toLocaleDateString();
}

function processingTime(order: AdminOrderDetail) {
  if (!order.completed_at) return "In progress";
  const hours = Math.max(0, Math.round((new Date(order.completed_at).getTime() - new Date(order.created_at).getTime()) / 3_600_000));
  const days = Math.floor(hours / 24);
  return days ? `${days}d ${hours % 24}h` : `${hours}h`;
}

function RecordSection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section className="admin-record-section">
      <header><span>{number}</span><h2>{title}</h2></header>
      {children}
    </section>
  );
}

function Facts({ children }: { children: ReactNode }) {
  return <dl className="admin-record-facts">{children}</dl>;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt>{label}</dt><dd>{children || "—"}</dd></div>;
}

export function JobDetailReal({ order, offers, proofs, payments }: {
  order: AdminOrderDetail;
  offers: JobOfferRow[];
  proofs: ProofRow[];
  payments: PaymentRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [deadline, setDeadline] = useState("");

  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const outstanding = Math.max(0, order.vendor_payout_amount - paid);
  const paymentStatus = outstanding === 0 ? "Paid in full" : paid > 0 ? "Partially paid" : "Unpaid";
  const deliveryComplete = order.email_status === "delivered" && order.telegram_status === "delivered";
  const groupedProofs = proofs.reduce<Record<string, ProofRow[]>>((groups, proof) => {
    (groups[proof.category ?? "other"] ??= []).push(proof);
    return groups;
  }, {});

  const timeline = [
    { label: "Job created", at: order.created_at },
    order.broadcast_started_at && { label: "Job offered to vendors", at: order.broadcast_started_at },
    order.accepted_at && { label: "Vendor accepted", at: order.accepted_at },
    order.proof_submitted_at && { label: "Media submitted", at: order.proof_submitted_at },
    order.admin_verified_at && { label: order.admin_verification_status === "approved" ? "Admin verified" : "Revision requested", at: order.admin_verified_at },
    order.email_sent_at && { label: "Customer email delivered", at: order.email_sent_at },
    order.telegram_sent_at && { label: "Customer Telegram delivered", at: order.telegram_sent_at },
    ...payments.map((payment) => ({ label: `Vendor payment — ${formatCents(payment.amount)}`, at: payment.created_at })),
    order.completed_at && { label: "Job completed", at: order.completed_at },
    order.closed_at && { label: "Job closed", at: order.closed_at },
  ].filter((event): event is { label: string; at: string } => Boolean(event)).sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  function run(key: string, task: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(key);
    setError(null);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) setError(result.error ?? "The update could not be saved.");
      setBusy(null);
    });
  }

  const broadcast = () => run("broadcast", () => broadcastOrderAction(order.id, deadline ? new Date(deadline).toISOString() : undefined));
  const review = (approved: boolean) => run("review", () => reviewProofAction(order.id, approved, reviewNotes));
  const recordDelivery = (channel: "email" | "telegram", delivered: boolean) => run(channel, () => recordCustomerDeliveryAction(order.id, channel, delivered));

  return (
    <>
      <nav className="breadcrumb"><Link href="/admin">Jobs</Link><span aria-hidden="true">/</span><span>{order.reference}</span></nav>

      <header className="admin-record-hero mt-6">
        <div>
          <span className="vendor-job-table-category">Amanah record · {order.service_type}</span>
          <h1 className="display">{orderTitle(order)}</h1>
          <p>{order.reference} · Created {formatDate(order.created_at)}</p>
        </div>
        <span className={`vendor-status vendor-status-${adminStatusPillVariant(order.status)}`}>{adminOrderStatusLabel[order.status]}</span>
      </header>

      <div className="admin-state-rail">
        <div><span>Operational</span><strong>{order.admin_verification_status === "approved" ? "Verified" : adminOrderStatusLabel[order.status]}</strong><small>{order.admin_verified_at ? formatDate(order.admin_verified_at, true) : "Awaiting fulfilment"}</small></div>
        <div><span>Customer delivery</span><strong>{deliveryComplete ? "Delivered" : "Pending"}</strong><small>{deliveryComplete ? "Email and Telegram confirmed" : "Both channels are required"}</small></div>
        <div><span>Vendor settlement</span><strong>{paymentStatus}</strong><small>{formatCents(outstanding)} outstanding</small></div>
        <div className={order.status === "closed" ? "is-complete" : ""}><span>Closure</span><strong>{order.status === "closed" ? "Closed" : "Open"}</strong><small>{order.closed_at ? formatDate(order.closed_at, true) : "Closes after delivery and payment"}</small></div>
      </div>

      {error && <p className="auth-error mt-4">{error}</p>}

      <div className="admin-record-layout mt-5">
        <main className="admin-record-main">
          <RecordSection number="01" title="Job information">
            <Facts>
              <Fact label="Job ID">{order.id}</Fact><Fact label="Service type">{order.service_type}</Fact>
              <Fact label="Package purchased">{orderTitle(order)}</Fact><Fact label="Order number">{order.reference}</Fact>
              <Fact label="Created">{formatDate(order.created_at, true)}</Fact><Fact label="Assigned">{formatDate(order.broadcast_started_at, true)}</Fact>
              <Fact label="Completed">{formatDate(order.completed_at, true)}</Fact><Fact label="Processing time">{processingTime(order)}</Fact>
            </Facts>
          </RecordSection>

          <RecordSection number="02" title="Customer information">
            <Facts><Fact label="Customer">{order.customer_name}</Fact><Fact label="Contact number">{order.customer_phone}</Fact><Fact label="Email">{order.customer_email}</Fact><Fact label="Invoice / order">{order.reference}</Fact></Facts>
          </RecordSection>

          <RecordSection number="03" title="Beneficiary information">
            <Facts><Fact label="Country">{order.beneficiary_country}</Fact><Fact label="State / district">{order.beneficiary_state}</Fact><Fact label="Village / locality">{order.beneficiary_village}</Fact><Fact label="Partner organisation">{order.partner_organisation}</Fact><Fact label="Beneficiaries">{order.beneficiary_names.join(", ")}</Fact></Facts>
          </RecordSection>

          <RecordSection number="04" title="Dedication and nameplate">
            <Facts><Fact label="Name(s)">{order.participant_names.join(", ") || order.dedication}</Fact><Fact label="Arabic spelling"><span dir="rtl">{order.dedication_arabic}</span></Fact><Fact label="Remarks">{order.dedication_remarks}</Fact></Facts>
            <a href={`/admin/jobs/${order.id}/nameplate`} target="_blank" rel="noreferrer" className="vendor-job-table-view mt-4 inline-block">Open nameplate →</a>
          </RecordSection>

          <RecordSection number="05" title="Vendor information">
            <Facts><Fact label="Vendor">{order.assigned_vendor?.display_name}</Fact><Fact label="Vendor ID">{order.assigned_vendor?.id}</Fact><Fact label="Accepted">{formatDate(order.accepted_at, true)}</Fact><Fact label="Submitted by">{order.assigned_vendor?.display_name}</Fact></Facts>
          </RecordSection>

          <RecordSection number="06" title="Project location">
            <Facts><Fact label="Country">{order.project_country}</Fact><Fact label="State / district">{order.project_state}</Fact><Fact label="Village / locality">{order.project_village}</Fact><Fact label="Exact address">{order.project_address}</Fact><Fact label="GPS coordinates">{order.project_lat != null && order.project_lng != null ? `${order.project_lat}, ${order.project_lng}` : null}</Fact></Facts>
            {order.project_maps_link && <a href={order.project_maps_link} target="_blank" rel="noreferrer" className="vendor-job-table-view mt-4 inline-block">Open Google Maps →</a>}
          </RecordSection>

          <RecordSection number="07" title="Completion evidence">
            <div className="admin-evidence-summary">
              {evidenceRequirements.map(([category, label, required]) => {
                const items = groupedProofs[category] ?? [];
                return <div key={category} className={items.length >= required ? "is-complete" : ""}><span>{label}</span><strong>{items.length} / {required}</strong></div>;
              })}
            </div>
            {proofs.length ? <div className="admin-proof-grid mt-5">{proofs.map((proof) => <a key={proof.id} href={proof.url ?? undefined} target="_blank" rel="noreferrer" className="admin-proof-tile">{proof.media_type === "video" ? "Video" : "Photo"}<small>{proof.category?.replaceAll("_", " ")}</small></a>)}</div> : <p className="vendor-empty mt-4">No evidence submitted yet.</p>}
          </RecordSection>

          <RecordSection number="08" title="Vendor remarks"><p className="admin-record-note">{order.vendor_remarks || "No vendor remarks recorded."}</p></RecordSection>

          <RecordSection number="09" title="Admin verification">
            {order.status === "proof_submitted" ? <div className="admin-review-box"><textarea className="input vendor-textarea" rows={4} placeholder="Verification notes. A reason is required when requesting revision." value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} /><div className="flex gap-3 mt-3"><button className="btn" type="button" disabled={pending} onClick={() => review(true)}>{busy === "review" ? "Saving…" : "Verify submission"}</button><button className="btn btn-secondary" type="button" disabled={pending || !reviewNotes.trim()} onClick={() => review(false)}>Request revision</button></div></div> : <Facts><Fact label="Status">{order.admin_verification_status === "approved" ? "Approved" : order.admin_verification_status === "rejected" ? "Revision required" : "Not reviewed"}</Fact><Fact label="Verified by">{order.admin_verifier_name}</Fact><Fact label="Verification date">{formatDate(order.admin_verified_at, true)}</Fact><Fact label="Notes">{order.admin_verification_notes}</Fact></Facts>}
          </RecordSection>

          <RecordSection number="10" title="Customer notification">
            <div className="admin-delivery-grid">
              {(["email", "telegram"] as const).map((channel) => {
                const status = channel === "email" ? order.email_status : order.telegram_status;
                const sentAt = channel === "email" ? order.email_sent_at : order.telegram_sent_at;
                return <div key={channel}><span>{channel === "email" ? "Email" : "Telegram"}</span><strong>{status === "delivered" ? "Delivered" : status === "failed" ? "Failed" : "Not sent"}</strong><small>{formatDate(sentAt, true)}</small>{["verified", "completed", "closed"].includes(order.status) && <div className="flex gap-2 mt-3"><button type="button" className="btn btn-small" disabled={pending || status === "delivered"} onClick={() => recordDelivery(channel, true)}>{busy === channel ? "Saving…" : "Record delivered"}</button><button type="button" className="btn-secondary btn btn-small" disabled={pending} onClick={() => recordDelivery(channel, false)}>Failed</button></div>}</div>;
              })}
            </div>
            <p className="admin-record-help">Email and Telegram sending are not connected yet. These controls record confirmed delivery without pretending a message was sent automatically.</p>
          </RecordSection>

          <RecordSection number="11" title="Payment tracking">
            <Facts><Fact label="Package price">{formatCents(order.total_amount)}</Fact><Fact label="Vendor cost">{formatCents(order.vendor_payout_amount)}</Fact><Fact label="Amount paid">{formatCents(paid)}</Fact><Fact label="Outstanding">{formatCents(outstanding)}</Fact></Facts>
            {payments.length > 0 && <div className="admin-payment-list mt-5">{payments.map((payment) => <div key={payment.id}><strong>{formatCents(payment.amount)}</strong><span>{formatDate(payment.payment_date)}{payment.method ? ` · ${payment.method}` : ""}</span><small>{payment.reference || "No reference"}</small></div>)}</div>}
            {order.assigned_vendor && <Link href={`/admin/vendors/${order.assigned_vendor.id}`} className="vendor-job-table-view mt-4 inline-block">Manage vendor payments →</Link>}
          </RecordSection>

          <RecordSection number="12" title="Audit timeline">
            <ol className="admin-audit-timeline">{timeline.map((event, index) => <li key={`${event.label}-${event.at}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{event.label}</strong><small>{formatDate(event.at, true)}</small></div></li>)}</ol>
          </RecordSection>
        </main>

        <aside className="admin-record-actions">
          <div className="card vendor-panel">
            <span className="vendor-eyebrow">Next action</span>
            {order.status === "submitted" && <div className="grid gap-3 mt-4"><label className="label">Completion deadline<input className="input mt-2" type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></label><button type="button" className="btn" disabled={pending} onClick={broadcast}>{busy === "broadcast" ? "Broadcasting…" : "Broadcast to vendors"}</button></div>}
            {order.status === "broadcasting" && <p className="vendor-empty mt-4">Waiting for an eligible vendor to accept.</p>}
            {order.status === "proof_submitted" && <p className="vendor-empty mt-4">Review all mandatory evidence in section 07.</p>}
            {order.status === "verified" && <p className="vendor-empty mt-4">Confirm customer delivery in section 10.</p>}
            {order.status === "completed" && outstanding > 0 && <p className="vendor-empty mt-4">The customer record is delivered. Settle {formatCents(outstanding)} to close this job.</p>}
            {order.status === "closed" && <p className="vendor-empty mt-4">All fulfilment, delivery, and payment requirements are complete.</p>}
            {order.status === "expired_unclaimed" && <button type="button" className="btn mt-4" disabled={pending} onClick={broadcast}>{busy === "broadcast" ? "Broadcasting…" : "Re-broadcast"}</button>}
            {order.completion_deadline && <p className="vendor-countdown mt-4">Deadline: {formatDate(order.completion_deadline, true)}</p>}
          </div>

          {order.status === "broadcasting" && <div className="card vendor-panel mt-4"><span className="vendor-eyebrow">Vendor offers</span><div className="vendor-report-list mt-4">{offers.map((offer) => <div key={offer.id} className="vendor-report-item"><div className="vendor-report-item-head"><strong>{offer.vendor?.display_name ?? "Unknown vendor"}</strong><span className="vendor-status vendor-status-pending">{offer.status}</span></div><small>Expires {formatDate(offer.expires_at, true)}</small></div>)}</div></div>}
        </aside>
      </div>
    </>
  );
}
