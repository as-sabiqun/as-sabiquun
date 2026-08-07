"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { broadcastOrderAction, generateCompletionReportsAction, resolveRefundedFulfilmentAction, retryNotificationDeliveryAction, reviewProofAction, updateOrderRecordDetailsAction } from "@/app/admin/actions";
import { lifecyclePillVariant, orderLifecycleLabel, type AdminLifecycleOrder } from "@/components/admin/operations-jobs";
import type { DeliveryStatus, FulfilmentStatus, PaymentStatus, SettlementStatus } from "@/lib/order-lifecycle";
import { formatCents, orderTitle, type OrderRow } from "@/lib/orders";
import { getCompletionReportAction } from "@/lib/reports/workflow";

export interface AdminOrderDetail extends OrderRow {
  payment_status: PaymentStatus;
  fulfilment_status: FulfilmentStatus;
  delivery_status: DeliveryStatus;
  settlement_status: SettlementStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_id: string | null;
  currency: string;
  unit_amount: number;
  commission_amount: number;
  vendor_payout_amount: number;
  payment_reference: string | null;
  payment_provider: "hitpay" | "manual" | "demo";
  entry_source: "customer" | "admin_manual";
  notes: string | null;
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
  broadcast_expires_at: string | null;
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
  refund_fulfilment_resolution: "cancelled_work" | "retained_verified" | null;
  refund_resolution_reason: string | null;
  refund_resolved_at: string | null;
  updated_at: string;
}

export interface JobOfferRow {
  id: string;
  status: string;
  offered_at: string;
  expires_at: string;
  vendor: { id: string; display_name: string } | null;
}

export interface CompletionSubmissionRow {
  id: string;
  version: number;
  status: "submitted" | "approved" | "revision_required";
  project_country: string;
  project_state: string;
  project_village: string;
  project_address: string;
  project_lat: number;
  project_lng: number;
  project_maps_link: string | null;
  vendor_remarks: string;
  submitted_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  review_checklist: Record<string, boolean>;
  vendor: { id: string; display_name: string } | null;
  reviewer: { display_name: string } | null;
}

export interface ProofRow {
  id: string;
  submission_id: string | null;
  media_type: "photo" | "video";
  category: string | null;
  evidence_slot: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  url: string | null;
}

export interface NotificationRow {
  id: string;
  report_id: string;
  channel: "email" | "telegram";
  recipient: string;
  attempt: number;
  status: string;
  provider_message_id: string | null;
  error_code: string | null;
  error_message: string | null;
  next_retry_at: string;
  attempted_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompletionReportRow {
  id: string;
  submission_id: string;
  kind: "internal" | "customer";
  version: number;
  storage_path: string;
  checksum: string;
  generated_at: string;
}

export interface ProviderTransactionRow {
  id: string;
  provider: "hitpay" | "manual";
  transaction_type: "payment" | "refund";
  provider_request_id: string;
  provider_payment_id: string | null;
  amount: number;
  currency: string;
  status: string;
  reason: string | null;
  provider_event_at: string | null;
  created_at: string;
}

export interface PaymentRow {
  id: string;
  amount: number;
  currency: string;
  payment_date: string;
  method: string | null;
  reference: string | null;
  notes: string | null;
  entry_type: "payment" | "reversal" | "adjustment";
  reverses_payment_id: string | null;
  created_at: string;
}

export interface OrderEventRow {
  id: number;
  actor_id: string | null;
  actor_role: "customer" | "vendor" | "admin" | "system";
  event_type: string;
  source: string;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const evidenceRequirements = [
  ["before_photo", "Before photos", 3], ["during_photo", "During photos", 3], ["after_photo", "After photos", 3],
  ["before_video", "Before video", 1], ["during_video", "During video", 1], ["after_video", "After video", 1], ["dua_video", "Du'a video", 1],
] as const;

const recordSections = [
  ["01", "job-information", "Job"],
  ["02", "customer-information", "Customer"],
  ["03", "beneficiary-information", "Beneficiary"],
  ["04", "dedication-nameplate", "Dedication"],
  ["05", "vendor-information", "Vendor"],
  ["06", "project-location", "Location"],
  ["07", "completion-evidence", "Evidence"],
  ["08", "vendor-remarks", "Remarks"],
  ["09", "admin-verification", "Verification"],
  ["10", "customer-notification", "Delivery"],
  ["11", "payment-tracking", "Finance"],
  ["12", "audit-timeline", "Audit"],
] as const;

function formatDate(value: string | null, withTime = false) {
  if (!value) return "Not recorded";
  return withTime ? new Date(value).toLocaleString() : new Date(value).toLocaleDateString();
}

function processingTime(order: AdminOrderDetail) {
  const end = order.completed_at || (order.fulfilment_status === "verified" ? order.admin_verified_at : null);
  if (!end) return "In progress";
  const hours = Math.max(0, Math.round((new Date(end).getTime() - new Date(order.created_at).getTime()) / 3_600_000));
  return hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h`;
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replaceAll(".", " · ").replace(/^./, (letter) => letter.toUpperCase());
}

function RecordSection({ id, number, title, children }: { id: string; number: string; title: string; children: ReactNode }) {
  return <section id={id} className="admin-record-section"><header><span>{number}</span><h2>{title}</h2></header>{children}</section>;
}
function Facts({ children }: { children: ReactNode }) { return <dl className="admin-record-facts">{children}</dl>; }
function Fact({ label, children }: { label: string; children: ReactNode }) { return <div><dt>{label}</dt><dd>{children || "—"}</dd></div>; }

export function JobDetailReal({ order, offers, submissions, proofs, notifications, reports, transactions, payments, events, warnings }: {
  order: AdminOrderDetail;
  offers: JobOfferRow[];
  submissions: CompletionSubmissionRow[];
  proofs: ProofRow[];
  notifications: NotificationRow[];
  reports: CompletionReportRow[];
  transactions: ProviderTransactionRow[];
  payments: PaymentRow[];
  events: OrderEventRow[];
  warnings: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewChecks, setReviewChecks] = useState<Record<string, boolean>>({});
  const [refundResolutionReason, setRefundResolutionReason] = useState("");
  const [deadline, setDeadline] = useState("");
  const [recordSaved, setRecordSaved] = useState(false);
  const [recordDetails, setRecordDetails] = useState({
    beneficiaryCountry: order.beneficiary_country ?? "",
    beneficiaryState: order.beneficiary_state ?? "",
    beneficiaryVillage: order.beneficiary_village ?? "",
    partnerOrganisation: order.partner_organisation ?? "",
    beneficiaryNames: order.beneficiary_names.join("\n"),
    dedicationArabic: order.dedication_arabic ?? "",
    dedicationRemarks: order.dedication_remarks ?? "",
  });

  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const outstanding = Math.max(0, order.vendor_payout_amount - paid);
  const latestSubmission = submissions[0] ?? null;
  const deliveryComplete = order.delivery_status === "delivered";
  const recordLocked = reports.length > 0;
  const lifecycleOrder = order as unknown as AdminLifecycleOrder;
  const recordIncomplete = warnings.length > 0;
  const hasCustomerReport = reports.some((report) => report.kind === "customer");
  const hasInternalReport = reports.some((report) => report.kind === "internal");
  const reportAction = getCompletionReportAction({
    verified: order.fulfilment_status === "verified",
    deliveryComplete,
    notificationCount: notifications.length,
    hasCustomerReport,
    hasInternalReport,
  });

  function run(key: string, task: () => Promise<{ ok: boolean; error?: string; offered?: number; resolution?: string }>) {
    setBusy(key); setError(null); setNotice(null);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) setError(result.error ?? "The update could not be saved.");
      else if (key === "broadcast") setNotice(result.offered ? `Offer sent to ${result.offered} eligible partner${result.offered === 1 ? "" : "s"}.` : "No eligible partner matched this service and country. The job remains in the unclaimed queue.");
      else if (key === "refund-resolution") setNotice(result.resolution === "retained_verified" ? "The verified work record was retained; no further fulfilment is required." : "Remaining fulfilment was cancelled and all open offers were expired.");
      setBusy(null);
    });
  }
  const broadcast = () => run("broadcast", () => broadcastOrderAction(order.id, deadline ? new Date(deadline).toISOString() : undefined));
  const review = (approved: boolean) => run("review", () => reviewProofAction(order.id, approved, reviewNotes, Object.keys(reviewChecks).filter((key) => reviewChecks[key])));
  const reviewComplete = ["location", "before_media", "during_media", "after_media", "dua_video", "nameplate_execution"].every((key) => reviewChecks[key]);
  const generateReports = () => run("reports", () => generateCompletionReportsAction(order.id));
  const refreshInternalReport = () => run("internal-report", () => generateCompletionReportsAction(order.id, true));
  const retryDelivery = (deliveryId: string) => run(`retry-${deliveryId}`, () => retryNotificationDeliveryAction(order.id, deliveryId));
  const resolveRefund = () => run("refund-resolution", () => resolveRefundedFulfilmentAction(order.id, refundResolutionReason));
  const changeRecordDetail = (field: keyof typeof recordDetails, value: string) => {
    setRecordDetails((current) => ({ ...current, [field]: value }));
    setRecordSaved(false);
  };
  const saveRecordDetails = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    run("record-details", async () => {
      const result = await updateOrderRecordDetailsAction({
        orderId: order.id,
        ...recordDetails,
        beneficiaryNames: recordDetails.beneficiaryNames.split(/\r?\n/).map((name) => name.trim()).filter(Boolean),
      });
      if (result.ok) setRecordSaved(true);
      return result;
    });
  };

  return (
    <>
      <nav className="breadcrumb"><Link href="/admin/jobs">Jobs</Link><span aria-hidden="true">/</span><span>{order.reference}</span></nav>

      <header className="admin-record-hero mt-6">
        <div><span className="vendor-job-table-category">Amanah record · {order.service_type}</span><h1 className="display">{orderTitle(order)}</h1><p>{order.reference} · Created {formatDate(order.created_at)}</p></div>
        <span className={`vendor-status vendor-status-${lifecyclePillVariant(order)}`}>{orderLifecycleLabel(lifecycleOrder)}</span>
      </header>

      <div className="admin-state-rail">
        <div><span>Payment</span><strong>{humanize(order.payment_status)}</strong><small>Provider-confirmed</small></div>
        <div><span>Fulfilment</span><strong>{humanize(order.fulfilment_status)}</strong><small>{order.admin_verified_at ? formatDate(order.admin_verified_at, true) : "Operational workflow"}</small></div>
        <div><span>Customer delivery</span><strong>{humanize(order.delivery_status)}</strong><small>{deliveryComplete ? "Email delivered and Telegram sent" : "Both channels are required"}</small></div>
        <div className={order.settlement_status === "paid" ? "is-complete" : ""}><span>Vendor settlement</span><strong>{humanize(order.settlement_status)}</strong><small>{formatCents(outstanding)} outstanding</small></div>
      </div>

      <nav className="admin-record-index mt-4" aria-label="Job record sections">
        <span>Record</span>
        <div>{recordSections.map(([number, id, label]) => <a key={id} href={`#${id}`}><small>{number}</small>{label}</a>)}</div>
      </nav>

      {error && <p className="auth-error mt-4" role="alert">{error}</p>}
      {notice && <p className="vendor-empty mt-4" role="status">{notice}</p>}
      {warnings.length > 0 && <p className="auth-error mt-4" role="alert">Some historical records could not be loaded. Refresh before taking action. {warnings.join(" · ")}</p>}

      <div className="admin-record-layout mt-5">
        <main className="admin-record-main">
          <RecordSection id="job-information" number="01" title="Job information">
            <Facts>
              <Fact label="Job ID">{order.id}</Fact><Fact label="Service type">{order.service_type}</Fact>
              <Fact label="Package purchased">{orderTitle(order)}</Fact><Fact label="Order number">{order.reference}</Fact>
              <Fact label="Order source">{order.entry_source === "admin_manual" ? "Entered by admin" : "Customer checkout"}</Fact><Fact label="Payment route">{order.payment_provider === "manual" ? "Paid offline" : humanize(order.payment_provider)}</Fact>
              <Fact label="Created">{formatDate(order.created_at, true)}</Fact><Fact label="Assigned">{formatDate(order.accepted_at, true)}</Fact>
              <Fact label="Completed for customer">{formatDate(order.completed_at, true)}</Fact><Fact label="Total processing time">{processingTime(order)}</Fact>
            </Facts>
          </RecordSection>

          <RecordSection id="customer-information" number="02" title="Customer information"><Facts><Fact label="Customer">{order.customer_name}</Fact><Fact label="Contact number">{order.customer_phone}</Fact><Fact label="Email">{order.customer_email}</Fact><Fact label="Invoice / order">{order.reference}</Fact></Facts></RecordSection>

          <form className="admin-record-editor" onSubmit={saveRecordDetails}>
            <RecordSection id="beneficiary-information" number="03" title="Beneficiary information">
              <div className="admin-form-grid">
                <label className="label">Country<input className="input" maxLength={100} disabled={recordLocked} value={recordDetails.beneficiaryCountry} onChange={(event) => changeRecordDetail("beneficiaryCountry", event.target.value)} /></label>
                <label className="label">State / province / district<input className="input" maxLength={120} disabled={recordLocked} value={recordDetails.beneficiaryState} onChange={(event) => changeRecordDetail("beneficiaryState", event.target.value)} /></label>
                <label className="label">Village / locality<input className="input" maxLength={160} disabled={recordLocked} value={recordDetails.beneficiaryVillage} onChange={(event) => changeRecordDetail("beneficiaryVillage", event.target.value)} /></label>
                <label className="label">Partner organisation<input className="input" maxLength={200} disabled={recordLocked} value={recordDetails.partnerOrganisation} onChange={(event) => changeRecordDetail("partnerOrganisation", event.target.value)} /></label>
                <label className="label">Beneficiary names, one per line<textarea className="input vendor-textarea" rows={4} disabled={recordLocked} value={recordDetails.beneficiaryNames} onChange={(event) => changeRecordDetail("beneficiaryNames", event.target.value)} /></label>
              </div>
            </RecordSection>

            <RecordSection id="dedication-nameplate" number="04" title="Dedication and nameplate">
              <Facts><Fact label="Name(s)">{order.participant_names.join(", ") || order.dedication}</Fact></Facts>
              <div className="admin-form-grid mt-4">
                <label className="label">Arabic spelling (optional)<input className="input" dir="rtl" maxLength={500} disabled={recordLocked} value={recordDetails.dedicationArabic} onChange={(event) => changeRecordDetail("dedicationArabic", event.target.value)} /></label>
                <label className="label">Dedication remarks<textarea className="input vendor-textarea" rows={4} maxLength={2000} disabled={recordLocked} value={recordDetails.dedicationRemarks} onChange={(event) => changeRecordDetail("dedicationRemarks", event.target.value)} /></label>
              </div>
              <div className="flex gap-3 mt-4"><button type="submit" className="btn" disabled={pending || recordIncomplete || recordLocked}>{busy === "record-details" ? "Saving…" : "Save record details"}</button><a href={`/admin/jobs/${order.id}/nameplate`} target="_blank" rel="noreferrer" className="btn btn-secondary">Open nameplate</a></div>
              <p className="admin-record-help">{recordLocked ? "These details are locked because a completion report already exists." : recordSaved ? "Record details saved and added to the audit timeline." : "Save these details before generating the completion report."}</p>
            </RecordSection>
          </form>

          <RecordSection id="vendor-information" number="05" title="Vendor information"><Facts><Fact label="Vendor">{order.assigned_vendor?.display_name}</Fact><Fact label="Vendor ID">{order.assigned_vendor?.id}</Fact><Fact label="Accepted">{formatDate(order.accepted_at, true)}</Fact><Fact label="Submitted by">{latestSubmission?.vendor?.display_name}</Fact></Facts></RecordSection>

          <RecordSection id="project-location" number="06" title="Project location">
            <Facts><Fact label="Country">{latestSubmission?.project_country || order.project_country}</Fact><Fact label="State / district">{latestSubmission?.project_state || order.project_state}</Fact><Fact label="Village / locality">{latestSubmission?.project_village || order.project_village}</Fact><Fact label="Exact address">{latestSubmission?.project_address || order.project_address}</Fact><Fact label="GPS coordinates">{latestSubmission ? `${latestSubmission.project_lat}, ${latestSubmission.project_lng}` : order.project_lat != null && order.project_lng != null ? `${order.project_lat}, ${order.project_lng}` : null}</Fact></Facts>
            {(latestSubmission?.project_maps_link || order.project_maps_link) && <a href={latestSubmission?.project_maps_link || order.project_maps_link || undefined} target="_blank" rel="noreferrer" className="vendor-job-table-view mt-4 inline-block">Open map →</a>}
          </RecordSection>

          <RecordSection id="completion-evidence" number="07" title="Completion evidence">
            {submissions.length === 0 ? <p className="vendor-empty">No immutable submission exists yet.</p> : submissions.map((submission) => {
              const versionProofs = proofs.filter((proof) => proof.submission_id === submission.id);
              const counts = versionProofs.reduce<Record<string, number>>((all, proof) => ({ ...all, [proof.category || "extra"]: (all[proof.category || "extra"] || 0) + 1 }), {});
              return (
                <article key={submission.id} className="vendor-report-item mb-4">
                  <div className="vendor-report-item-head"><div><strong>Submission v{submission.version}</strong><small>{submission.vendor?.display_name || "Vendor"} · {formatDate(submission.submitted_at, true)}</small></div><span className={`vendor-status ${submission.status === "approved" ? "vendor-status-completed" : submission.status === "revision_required" ? "vendor-status-rejected" : "vendor-status-pending"}`}>{humanize(submission.status)}</span></div>
                  <div className="admin-evidence-summary mt-4">{evidenceRequirements.map(([category, label, required]) => <div key={category} className={(counts[category] || 0) === required ? "is-complete" : ""}><span>{label}</span><strong>{counts[category] || 0} / {required}</strong></div>)}</div>
                  <div className="admin-proof-grid mt-4">{versionProofs.map((proof) => <a key={proof.id} href={proof.url ?? undefined} target="_blank" rel="noreferrer" className="admin-proof-tile">{proof.media_type === "video" ? "Video" : "Photo"}<small>{humanize(proof.evidence_slot || proof.category || "evidence")}</small></a>)}</div>
                  {submission.review_notes && <p className="admin-record-note mt-4"><strong>Review note:</strong> {submission.review_notes}</p>}
                </article>
              );
            })}
          </RecordSection>

          <RecordSection id="vendor-remarks" number="08" title="Vendor remarks"><p className="admin-record-note">{latestSubmission?.vendor_remarks || order.vendor_remarks || "No vendor remarks recorded."}</p></RecordSection>

          <RecordSection id="admin-verification" number="09" title="Admin verification">
            {order.fulfilment_status === "proof_submitted" ? (
              <div className="admin-review-box">
                <div className="grid gap-2 mb-4">
                  {[["location","Exact location and GPS"],["before_media","Before media"],["during_media","During media"],["after_media","After media"],["dua_video","Du'a video"],["nameplate_execution","Nameplate, dedication, and execution"]].map(([key,label]) => <label key={key} className="vendor-terms-check"><input type="checkbox" checked={Boolean(reviewChecks[key])} onChange={(event) => setReviewChecks((current) => ({ ...current, [key]: event.target.checked }))} /><span>{label} reviewed</span></label>)}
                </div>
                <textarea className="input vendor-textarea" rows={4} placeholder="Verification notes. A reason is mandatory when requesting revision." value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} />
                <div className="flex gap-3 mt-3"><button className="btn" type="button" disabled={pending || recordIncomplete || !reviewComplete} onClick={() => review(true)}>{busy === "review" ? "Saving…" : "Approve submission"}</button><button className="btn btn-secondary" type="button" disabled={pending || recordIncomplete || !reviewNotes.trim()} onClick={() => review(false)}>Request revision</button></div>
              </div>
            ) : <Facts><Fact label="Status">{order.admin_verification_status ? humanize(order.admin_verification_status) : "Not reviewed"}</Fact><Fact label="Verified by">{order.admin_verifier_name}</Fact><Fact label="Verification date">{formatDate(order.admin_verified_at, true)}</Fact><Fact label="Notes">{order.admin_verification_notes}</Fact></Facts>}
          </RecordSection>

          <RecordSection id="customer-notification" number="10" title="Customer notification">
            <div className="admin-delivery-grid">{(["email", "telegram"] as const).map((channel) => {
              const attempts = notifications.filter((item) => item.channel === channel);
              const latest = attempts.reduce<NotificationRow | undefined>((current, item) => !current || item.attempt > current.attempt ? item : current, undefined);
              const canRetry = latest && ["deferred", "bounced", "blocked", "failed"].includes(latest.status);
              return <div key={channel}><span>{channel === "email" ? "Email via Brevo" : "Telegram document"}</span><strong>{latest ? humanize(latest.status) : "Not queued"}</strong><small>{latest ? `Attempt ${latest.attempt} · ${formatDate(latest.delivered_at || latest.sent_at || latest.attempted_at, true)}` : "No provider attempt"}</small>{latest?.error_message && <p className="admin-record-help">{latest.error_message}</p>}{canRetry && <button type="button" className="btn btn-secondary btn-small mt-3" disabled={pending || recordIncomplete} onClick={() => retryDelivery(latest.id)}>{busy === `retry-${latest.id}` ? "Queuing…" : "Retry delivery"}</button>}</div>;
            })}</div>
            {reports.length > 0 && <div className="admin-payment-list mt-5">{reports.map((report) => <div key={report.id}><strong>{humanize(report.kind)} report v{report.version}</strong><span>Generated {formatDate(report.generated_at, true)}</span><small><Link href={`/reports/${report.id}`}>Secure download →</Link></small></div>)}</div>}
            {reportAction && <button type="button" className="btn mt-5" disabled={pending || recordIncomplete} onClick={generateReports}>{busy === "reports" ? "Preparing reports…" : reportAction === "recover_internal" ? "Recover internal audit report" : reportAction === "queue_delivery" ? "Queue customer delivery" : "Generate and queue reports"}</button>}
            {hasInternalReport && <button type="button" className="btn btn-secondary btn-small mt-4" disabled={pending || recordIncomplete} onClick={refreshInternalReport}>{busy === "internal-report" ? "Refreshing…" : "Refresh internal audit report"}</button>}
            <p className="admin-record-help">Delivery state comes only from Brevo webhooks and Telegram send results. Administrators cannot mark delivery manually.</p>
          </RecordSection>

          <RecordSection id="payment-tracking" number="11" title="Payment tracking">
            <Facts><Fact label="Package price">{formatCents(order.total_amount)}</Fact><Fact label="Payment state">{humanize(order.payment_status)}</Fact><Fact label="Vendor cost">{formatCents(order.vendor_payout_amount)}</Fact><Fact label="Vendor paid">{formatCents(paid)}</Fact><Fact label="Vendor outstanding">{formatCents(outstanding)}</Fact><Fact label="Currency">{order.currency}</Fact></Facts>
            {transactions.length > 0 && <><p className="vendor-eyebrow mt-5 mb-2">Payment transactions</p><div className="admin-payment-list">{transactions.map((transaction) => <div key={transaction.id}><strong>{formatCents(transaction.transaction_type === "refund" ? -transaction.amount : transaction.amount)}</strong><span>{humanize(transaction.provider)} · {humanize(transaction.transaction_type)} · {humanize(transaction.status)}</span><small>{transaction.provider_payment_id || transaction.provider_request_id}{transaction.reason ? ` · ${transaction.reason}` : ""}</small></div>)}</div></>}
            {payments.length > 0 && <><p className="vendor-eyebrow mt-5 mb-2">Vendor settlement ledger</p><div className="admin-payment-list">{payments.map((payment) => <div key={payment.id}><strong>{formatCents(payment.amount)}</strong><span>{humanize(payment.entry_type)} · {formatDate(payment.payment_date)} · {payment.method || "Method not recorded"}</span><small>{payment.reference || "No reference"}</small></div>)}</div></>}
            <Link href="/admin/finance" className="vendor-job-table-view mt-4 inline-block">Open finance →</Link>
          </RecordSection>

          <RecordSection id="audit-timeline" number="12" title="Audit timeline">
            {events.length === 0 ? <p className="vendor-empty">No system audit events are available.</p> : <ol className="admin-audit-timeline">{events.map((event, index) => <li key={event.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{humanize(event.event_type)}</strong><small>{event.actor_role}{event.actor_id ? ` · ${event.actor_id}` : ""} · {event.source} · {formatDate(event.created_at, true)}</small>{(event.previous_state || event.new_state) && <details className="mt-2 text-xs"><summary>State change</summary><pre className="mt-2 whitespace-pre-wrap overflow-auto">{JSON.stringify({ from: event.previous_state, to: event.new_state }, null, 2)}</pre></details>}</div></li>)}</ol>}
          </RecordSection>
        </main>

        <aside className="admin-record-actions">
          <div className="card vendor-panel">
            <span className="vendor-eyebrow">Next action</span>
            {order.payment_status === "pending" && <p className="vendor-empty mt-4">Await verified HitPay payment. A redirect cannot unlock fulfilment.</p>}
            {["failed", "expired"].includes(order.payment_status) && <p className="vendor-empty mt-4">Payment needs customer retry or finance review.</p>}
            {order.payment_status === "refunded" && !["not_ready", "cancelled"].includes(order.fulfilment_status) && !order.refund_fulfilment_resolution && (
              <div className="grid gap-3 mt-4">
                <p className="auth-error">Payment was fully refunded while fulfilment was active. Resolve the operational record before any further work.</p>
                <label className="label">Resolution reason<textarea className="input vendor-textarea mt-2" rows={3} maxLength={1000} required value={refundResolutionReason} onChange={(event) => setRefundResolutionReason(event.target.value)} /></label>
                <button type="button" className="btn" disabled={pending || !refundResolutionReason.trim()} onClick={resolveRefund}>{busy === "refund-resolution" ? "Resolving…" : order.fulfilment_status === "verified" ? "Retain verified record" : "Cancel remaining work"}</button>
              </div>
            )}
            {order.refund_fulfilment_resolution && <p className="vendor-empty mt-4">Refund resolution: {humanize(order.refund_fulfilment_resolution)} · {order.refund_resolution_reason} · {formatDate(order.refund_resolved_at, true)}</p>}
            {order.fulfilment_status === "ready" && <div className="grid gap-3 mt-4"><label className="label">Completion deadline<input className="input mt-2" type="datetime-local" required value={deadline} onChange={(event) => setDeadline(event.target.value)} /></label><button type="button" className="btn" disabled={pending || recordIncomplete || (!deadline && !order.completion_deadline)} onClick={broadcast}>{busy === "broadcast" ? "Broadcasting…" : order.broadcast_started_at ? "Re-broadcast to vendors" : "Broadcast to vendors"}</button></div>}
            {order.fulfilment_status === "broadcasting" && <p className="vendor-empty mt-4">Waiting for an eligible partner to accept the active offer.</p>}
            {["assigned", "in_progress"].includes(order.fulfilment_status) && <p className="vendor-empty mt-4">The assigned partner is carrying out the work.</p>}
            {order.fulfilment_status === "revision_required" && <p className="vendor-empty mt-4">The partner must submit a new immutable version addressing the review note.</p>}
            {order.fulfilment_status === "proof_submitted" && <p className="vendor-empty mt-4">Check all 13 mandatory evidence slots before approving or requesting revision.</p>}
            {order.fulfilment_status === "verified" && order.delivery_status !== "delivered" && <p className="vendor-empty mt-4">Report generation and provider delivery must succeed on both channels.</p>}
            {order.delivery_status === "delivered" && order.settlement_status !== "paid" && <p className="vendor-empty mt-4">Customer delivery is complete. Settle {formatCents(outstanding)} in Finance to close the job.</p>}
            {order.delivery_status === "delivered" && order.settlement_status === "paid" && <p className="vendor-empty mt-4">All fulfilment, delivery, and settlement requirements are complete.</p>}
            {order.completion_deadline && <p className="vendor-countdown mt-4">Deadline: {formatDate(order.completion_deadline, true)}</p>}
          </div>

          {offers.length > 0 && <div className="card vendor-panel mt-4"><span className="vendor-eyebrow">Vendor offers</span><div className="vendor-report-list mt-4">{offers.map((offer) => <div key={offer.id} className="vendor-report-item"><div className="vendor-report-item-head"><strong>{offer.vendor?.display_name ?? "Unknown vendor"}</strong><span className="vendor-status vendor-status-pending">{humanize(offer.status)}</span></div><small>Offered {formatDate(offer.offered_at, true)} · Expires {formatDate(offer.expires_at, true)}</small></div>)}</div></div>}
        </aside>
      </div>
    </>
  );
}
