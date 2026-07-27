"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deriveOrderMilestone, milestoneLabels, type DeliveryStatus, type FulfilmentStatus, type PaymentStatus, type SettlementStatus } from "@/lib/order-lifecycle";
import { formatCents, orderTitle, type OrderRow } from "@/lib/orders";
import { vendorServiceOptions } from "@/lib/vendor-options";
import { ProofUploadFormReal } from "@/components/vendor/proof-upload-form-real";
import { claimJobAction, declineJobAction, markInProgressAction } from "@/app/vendor-dashboard/actions";

export interface VendorOrderDetail extends Omit<OrderRow, "total_amount"> {
  customer_name?: string;
  customer_phone?: string;
  vendor_payout_amount: number;
  admin_verification_notes?: string | null;
  offering_detail?: string | null;
  completion_deadline?: string | null;
  accepted_at?: string | null;
  beneficiary_country?: string | null;
  beneficiary_state?: string | null;
  beneficiary_village?: string | null;
  partner_organisation?: string | null;
  beneficiary_names?: string[];
  dedication_arabic?: string | null;
  dedication_remarks?: string | null;
  payment_status: PaymentStatus;
  fulfilment_status: FulfilmentStatus;
  delivery_status: DeliveryStatus;
  settlement_status: SettlementStatus;
}

export interface ProofRow {
  id: string;
  media_type: string;
  category: string | null;
  url: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  before_photo: "Before", during_photo: "During", after_photo: "After",
  before_video: "Before (video)", during_video: "During (video)", after_video: "After (video)", dua_video: "Du'a video",
};

const evidenceBrief = ["3 before, 3 during, and 3 after photos", "Before, during, after, and du'a videos", "Exact address and GPS coordinates", "Completion summary, conditions, and challenges"];

export function JobDetailReal({
  order,
  vendorId,
  isOffer,
  offerExpiresAt,
  proofs,
}: {
  order: VendorOrderDetail;
  vendorId: string;
  isOffer: boolean;
  offerExpiresAt: string | null;
  proofs: ProofRow[];
}) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);

  const milestone = deriveOrderMilestone(order);
  const needsWork = order.fulfilment_status === "in_progress" || order.fulfilment_status === "revision_required";
  const serviceLabel = vendorServiceOptions.find((service) => service.slug === order.category_slug)?.title ?? orderTitle(order);
  const workflowSteps = [
    { label: "Accepted", complete: !isOffer },
    { label: "In progress", complete: ["in_progress", "proof_submitted", "revision_required", "verified"].includes(order.fulfilment_status) },
    { label: "Submitted", complete: ["proof_submitted", "verified"].includes(order.fulfilment_status) },
    { label: "Admin review", complete: order.fulfilment_status === "verified" },
  ];

  function accept() {
    setBusy(true);
    setError(null);
    startTransition(async () => {
      const res = await claimJobAction(order.id);
      if (!res.ok) setError(res.error ?? "Couldn't accept this job.");
      else if (!res.claimed) setError("Someone else already claimed this job.");
      router.refresh();
      setBusy(false);
    });
  }

  function decline() {
    setBusy(true);
    setError(null);
    startTransition(async () => {
      const res = await declineJobAction(order.id);
      if (!res.ok) setError(res.error ?? "Couldn't decline this job.");
      else setDeclined(true);
      setBusy(false);
    });
  }

  function startWork() {
    setBusy(true);
    setError(null);
    startTransition(async () => {
      const res = await markInProgressAction(order.id);
      if (!res.ok) setError(res.error ?? "Couldn't update this job.");
      router.refresh();
      setBusy(false);
    });
  }

  if (declined) {
    return (
      <div className="card vendor-panel p-8 text-center">
        <p className="vendor-empty">You&apos;ve declined this job. It&apos;s no longer in your queue.</p>
        <Link href="/vendor-dashboard/jobs" className="btn mt-5">Back to jobs</Link>
      </div>
    );
  }

  return (
    <>
      <nav className="breadcrumb">
        <Link href="/vendor-dashboard/jobs">Jobs</Link>
        <span aria-hidden="true">/</span>
        <span>{orderTitle(order)}</span>
      </nav>

      <div className="vendor-detail-layout mt-6">
        <div className="card vendor-panel">
          <div className="vendor-detail-head">
            <div>
              <span className="vendor-job-table-category">{order.service_type}</span>
              <h1 className="display vendor-page-title mt-2">{orderTitle(order)}</h1>
              <p className="vendor-page-lead">{order.reference}</p>
            </div>
            <span className={`vendor-status vendor-status-${isOffer ? "pending" : ["verified", "completed", "closed", "under_review"].includes(milestone) ? "completed" : milestone === "revision_required" ? "rejected" : "accepted"}`}>
              {isOffer ? "Awaiting response" : milestoneLabels[milestone]}
            </span>
          </div>

          {order.fulfilment_status === "revision_required" && order.admin_verification_notes && (
            <p className="auth-error mt-6">Admin requested changes: {order.admin_verification_notes}</p>
          )}

          {!isOffer && (
            <ol className="vendor-job-progress mt-6" aria-label="Vendor job progress">
              {workflowSteps.map((step, index) => (
                <li key={step.label} className={step.complete ? "is-complete" : ""}>
                  <span>{step.complete ? "✓" : index + 1}</span>
                  <strong>{step.label}</strong>
                </li>
              ))}
            </ol>
          )}

          <section className="vendor-job-brief mt-6" aria-labelledby="vendor-job-brief-title">
            <span className="vendor-eyebrow">Execution brief</span>
            <h2 id="vendor-job-brief-title" className="display text-lg mt-1">Complete job details</h2>
            {order.offering_detail && <p className="vendor-page-lead mt-4">{order.offering_detail}</p>}
            <dl className="admin-contact-facts mt-4">
              <div><dt>Job / order ID</dt><dd>{order.reference}</dd></div>
              <div><dt>Service type</dt><dd>{serviceLabel}</dd></div>
              <div><dt>Package</dt><dd>{orderTitle(order)}</dd></div>
              <div><dt>Quantity</dt><dd>{order.quantity}</dd></div>
              <div><dt>Created</dt><dd>{new Date(order.created_at).toLocaleString()}</dd></div>
              {!isOffer && <div><dt>Accepted</dt><dd>{order.accepted_at ? new Date(order.accepted_at).toLocaleString() : "Not recorded"}</dd></div>}
              <div><dt>Target location</dt><dd>{[order.beneficiary_village, order.beneficiary_state, order.beneficiary_country].filter(Boolean).join(", ") || "Not recorded"}</dd></div>
              <div><dt>Completion deadline</dt><dd>{order.completion_deadline ? new Date(order.completion_deadline).toLocaleString() : "Not recorded"}</dd></div>
              {order.partner_organisation && <div><dt>Local organisation</dt><dd>{order.partner_organisation}</dd></div>}
            </dl>
          </section>

          {(order.participant_names?.length > 0 || order.dedication || order.dedication_arabic || order.dedication_remarks) && (
            <section className="vendor-job-brief mt-4" aria-labelledby="vendor-nameplate-title">
              <span className="vendor-eyebrow">Nameplate / dedication</span>
              <h2 id="vendor-nameplate-title" className="display text-lg mt-1">Names to reproduce</h2>
              <dl className="admin-contact-facts mt-4">
                {order.participant_names?.length > 0 && <div><dt>Names</dt><dd>{order.participant_names.join(", ")}</dd></div>}
                {order.dedication && <div><dt>Dedication</dt><dd>{order.dedication}</dd></div>}
                {order.dedication_arabic && <div><dt>Arabic spelling</dt><dd dir="rtl">{order.dedication_arabic}</dd></div>}
                {order.dedication_remarks && <div><dt>Remarks</dt><dd>{order.dedication_remarks}</dd></div>}
              </dl>
            </section>
          )}

          {!isOffer && (order.customer_name || (order.beneficiary_names && order.beneficiary_names.length > 0)) && (
            <section className="vendor-job-brief mt-4" aria-labelledby="vendor-customer-title">
              <span className="vendor-eyebrow">People</span>
              <h2 id="vendor-customer-title" className="display text-lg mt-1">Customer and beneficiaries</h2>
              <dl className="admin-contact-facts mt-4">
                {order.customer_name && <div><dt>Customer</dt><dd>{order.customer_name}</dd></div>}
                {order.customer_phone && <div><dt>Customer phone</dt><dd>{order.customer_phone}</dd></div>}
                {order.beneficiary_names && order.beneficiary_names.length > 0 && <div><dt>Beneficiaries</dt><dd>{order.beneficiary_names.join(", ")}</dd></div>}
              </dl>
            </section>
          )}

          <div className="vendor-report-item mt-4">
            <strong>Required before final submission</strong>
            <ul className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
              {evidenceBrief.map((item) => <li key={item}>✓ {item}</li>)}
            </ul>
          </div>

          {isOffer && (
            <div className="vendor-terms">
              <label className="vendor-terms-check">
                <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
                <span>I&apos;ve read the job brief above, and I agree to complete this job as described if I accept it.</span>
              </label>
            </div>
          )}

          {needsWork && (
            <div className="mt-8">
              <span className="label mb-3 block">Submit completion</span>
              <ProofUploadFormReal orderId={order.id} vendorId={vendorId} />
            </div>
          )}

          {(["proof_submitted", "revision_required", "verified"].includes(order.fulfilment_status)) && (
            <div className="mt-8 vendor-proof-summary">
              <span className="label mb-2 block">Submitted files</span>
              {proofs.length === 0 ? (
                <p className="vendor-empty">No files submitted yet.</p>
              ) : (
                <div className="admin-proof-grid">
                  {proofs.map((proof) => (
                    <a key={proof.id} href={proof.url ?? undefined} target="_blank" rel="noreferrer" className="admin-proof-tile">
                      {proof.media_type === "video" ? "🎥" : "🖼️"} {proof.category ? CATEGORY_LABEL[proof.category] ?? proof.category : ""}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card vendor-panel vendor-buy-box">
          <span className="vendor-eyebrow">Job payout</span>
          <strong className="numeral vendor-price">{formatCents(order.vendor_payout_amount)}</strong>

          {error && <p className="auth-error mt-4">{error}</p>}

          {isOffer && (
            <>
              {offerExpiresAt && <p className="vendor-countdown mt-2">Expires {new Date(offerExpiresAt).toLocaleString()}</p>}
              <div className="mt-6 grid gap-3">
                <button type="button" className="btn" disabled={!agreed || (pending && busy)} onClick={accept}>
                  {pending && busy ? "Accepting…" : "Accept job"}
                </button>
                <button type="button" className="btn-secondary btn" disabled={pending && busy} onClick={decline}>Reject job</button>
              </div>
              {!agreed && <p className="vendor-upload-hint">Agree to the terms on the left to accept.</p>}
            </>
          )}

          {order.fulfilment_status === "assigned" && (
            <button type="button" className="btn mt-6" disabled={pending && busy} onClick={startWork}>
              {pending && busy ? "Starting…" : "Mark as in progress"} <span aria-hidden="true">→</span>
            </button>
          )}

          {order.fulfilment_status === "in_progress" && <p className="vendor-empty mt-6">Upload the required photos, videos, and location details on the left when the work is complete.</p>}
          {order.fulfilment_status === "revision_required" && <p className="vendor-empty mt-6">Update the requested files or details on the left and submit again.</p>}
          {order.fulfilment_status === "proof_submitted" && <p className="vendor-empty mt-6">Submitted — waiting for admin review.</p>}
          {milestone === "verified" && <p className="vendor-empty mt-6">Approved. The completion report is being sent to the customer.</p>}
          {milestone === "completed" && <p className="vendor-empty mt-6">The customer received the report. Your payment is tracked separately.</p>}
          {milestone === "closed" && <p className="vendor-empty mt-6">Completed and paid in full.</p>}

          {/* eslint-disable-next-line react/no-unescaped-entities */}
          <Link href="/vendor-dashboard/reports" className="vendor-report-link">Can't complete this? Report an issue <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </>
  );
}
