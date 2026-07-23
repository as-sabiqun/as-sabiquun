"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useState } from "react";
import { useVendorData } from "@/components/vendor/vendor-data-context";
import { StatusPill } from "@/components/vendor/status-pill";
import { ProofUploadForm } from "@/components/vendor/proof-upload-form";
import { formatCountdown, formatDueDate } from "@/lib/vendor-demo";

export default function VendorJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { jobs, setJobStatus } = useVendorData();
  const job = jobs.find((j) => j.id === id);
  const [agreed, setAgreed] = useState(false);
  if (!job) notFound();

  const countdown = formatCountdown(job.respondBy);
  const due = formatDueDate(job.completeBy);
  const isWorking = job.status === "accepted" || job.status === "in_progress";

  return (
    <>
      <nav className="breadcrumb">
        <Link href="/vendor-dashboard/jobs">Jobs</Link>
        <span aria-hidden="true">/</span>
        <span>{job.title}</span>
      </nav>

      <div className="vendor-detail-layout mt-6">
        <div className="card vendor-panel">
          <div className="vendor-detail-head">
            <div>
              <span className="vendor-job-table-category">{job.category}</span>
              <h1 className="display vendor-page-title mt-2">{job.title}</h1>
              <p className="vendor-page-lead">{job.reference} · {job.location}</p>
            </div>
            <StatusPill status={job.status} />
          </div>

          <div className="mt-6">
            <span className="label mb-2 block">Job detail</span>
            <p className="text-sm leading-6 text-[var(--muted)]">{job.brief}</p>
          </div>

          {job.checklist.length > 0 && (
            <div className="mt-6">
              <span className="label mb-2 block">What you need to do</span>
              <ul className="vendor-checklist">
                {job.checklist.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}

          <div className="vendor-due-row">
            <span className={`vendor-countdown ${due.overdue ? "is-urgent" : ""}`}>{due.label}</span>
          </div>

          {job.status === "pending" && (
            <div className="vendor-terms">
              <label className="vendor-terms-check">
                <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
                <span>I've read the job brief and instructions above, and I agree to complete this job as described, by the date shown, if I accept it.</span>
              </label>
            </div>
          )}

          {isWorking && (
            <div className="mt-8">
              <span className="label mb-3 block">Submit completion</span>
              <ProofUploadForm jobId={job.id} />
            </div>
          )}

          {job.status === "completed" && job.proof && (
            <div className="mt-8 vendor-proof-summary">
              <span className="label mb-2 block">Submitted evidence</span>
              <div className="vendor-proof-summary-row">
                <span>{job.proof.photoCount} photos · 1 video</span>
                <span>{new Date(job.proof.submittedAt).toLocaleDateString()}</span>
              </div>
              {job.proof.notes && <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{job.proof.notes}</p>}
            </div>
          )}
        </div>

        <div className="card vendor-panel vendor-buy-box">
          <span className="vendor-eyebrow">Job payout</span>
          <strong className="numeral vendor-price">S${job.price}</strong>

          {job.status === "pending" && (
            <>
              <p className={`vendor-countdown mt-2 ${countdown.urgent ? "is-urgent" : ""}`}>{countdown.label}</p>
              <div className="mt-6 grid gap-3">
                <button type="button" className="btn" disabled={!agreed} onClick={() => setJobStatus(job.id, "accepted")}>Accept job</button>
                <button type="button" className="btn-secondary btn" onClick={() => setJobStatus(job.id, "rejected")}>Reject job</button>
              </div>
              {!agreed && <p className="vendor-upload-hint">Agree to the terms on the left to accept.</p>}
            </>
          )}

          {isWorking && (
            <div className="mt-6 grid gap-3">
              <p className="vendor-empty">Submit your completion evidence on the left to close this job out.</p>
            </div>
          )}

          {(job.status === "completed" || job.status === "rejected" || job.status === "expired") && (
            <div className="mt-6 grid gap-3">
              <p className="vendor-empty">No further action needed on this job.</p>
            </div>
          )}

          <Link href="/vendor-dashboard/reports" className="vendor-report-link">Can't complete this? Report an issue <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </>
  );
}
