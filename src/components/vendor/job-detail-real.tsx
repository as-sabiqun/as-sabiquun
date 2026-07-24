"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { vendorOrderStatusLabel } from "@/lib/vendor-orders";
import { formatCents, orderTitle, type OrderRow } from "@/lib/orders";
import { ProofUploadFormReal } from "@/components/vendor/proof-upload-form-real";
import { claimJobAction, declineJobAction, markInProgressAction } from "@/app/vendor-dashboard/actions";

export interface VendorOrderDetail extends OrderRow {
  customer_name?: string;
  customer_phone?: string;
}

export interface ProofRow {
  id: string;
  media_type: string;
  url: string | null;
}

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
        <p className="vendor-empty">You've declined this job. It's no longer in your queue.</p>
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
            <span className={`vendor-status vendor-status-${isOffer ? "pending" : order.status === "completed" ? "completed" : "accepted"}`}>
              {isOffer ? "Awaiting response" : vendorOrderStatusLabel[order.status]}
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

          {!isOffer && order.customer_name && (
            <div className="mt-6">
              <span className="label mb-2 block">Customer</span>
              <p className="text-sm text-[var(--muted)]">{order.customer_name} · {order.customer_phone}</p>
            </div>
          )}

          {isOffer && (
            <div className="vendor-terms">
              <label className="vendor-terms-check">
                <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
                <span>I've read the job brief above, and I agree to complete this job as described if I accept it.</span>
              </label>
            </div>
          )}

          {order.status === "in_progress" && (
            <div className="mt-8">
              <span className="label mb-3 block">Submit completion</span>
              <ProofUploadFormReal orderId={order.id} vendorId={vendorId} />
            </div>
          )}

          {(order.status === "proof_submitted" || order.status === "completed") && (
            <div className="mt-8 vendor-proof-summary">
              <span className="label mb-2 block">Submitted evidence</span>
              {proofs.length === 0 ? (
                <p className="vendor-empty">No evidence on record.</p>
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
          <span className="vendor-eyebrow">Job payout</span>
          <strong className="numeral vendor-price">{formatCents(order.total_amount)}</strong>

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

          {order.status === "assigned" && (
            <button type="button" className="btn mt-6" disabled={pending && busy} onClick={startWork}>
              {pending && busy ? "Starting…" : "Mark as in progress"} <span aria-hidden="true">→</span>
            </button>
          )}

          {order.status === "in_progress" && <p className="vendor-empty mt-6">Submit your completion evidence on the left to close this job out.</p>}
          {order.status === "proof_submitted" && <p className="vendor-empty mt-6">Submitted — awaiting review from operations.</p>}
          {order.status === "completed" && <p className="vendor-empty mt-6">Completed. No further action needed.</p>}

          <Link href="/vendor-dashboard/reports" className="vendor-report-link">Can't complete this? Report an issue <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </>
  );
}
