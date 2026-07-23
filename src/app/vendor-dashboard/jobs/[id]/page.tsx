"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import { useVendorData } from "@/components/vendor/vendor-data-context";
import { StatusPill } from "@/components/vendor/status-pill";
import { formatCountdown } from "@/lib/vendor-demo";

export default function VendorJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { jobs, setJobStatus } = useVendorData();
  const job = jobs.find((j) => j.id === id);
  if (!job) notFound();

  const countdown = formatCountdown(job.respondBy);

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

          <p className="mt-6 text-sm leading-6 text-[var(--muted)]">{job.brief}</p>

          {job.checklist.length > 0 && (
            <div className="mt-6">
              <span className="label mb-2 block">Checklist</span>
              <ul className="vendor-checklist">
                {job.checklist.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="card vendor-panel vendor-buy-box">
          <span className="vendor-eyebrow">Job payout</span>
          <strong className="numeral vendor-price">S${job.price}</strong>

          {job.status === "pending" && (
            <p className={`vendor-countdown mt-2 ${countdown.urgent ? "is-urgent" : ""}`}>{countdown.label}</p>
          )}

          <div className="mt-6 grid gap-3">
            {job.status === "pending" && (
              <>
                <button type="button" className="btn" onClick={() => setJobStatus(job.id, "accepted")}>Accept job</button>
                <button type="button" className="btn-secondary btn" onClick={() => setJobStatus(job.id, "rejected")}>Reject job</button>
              </>
            )}
            {job.status === "accepted" && (
              <button type="button" className="btn" onClick={() => setJobStatus(job.id, "in_progress")}>Mark as in progress</button>
            )}
            {job.status === "in_progress" && (
              <button type="button" className="btn" onClick={() => setJobStatus(job.id, "completed")}>Mark as completed</button>
            )}
            {(job.status === "completed" || job.status === "rejected" || job.status === "expired") && (
              <p className="vendor-empty">No further action needed on this job.</p>
            )}
          </div>

          <Link href="/vendor-dashboard/reports" className="vendor-report-link">Can't complete this? Report an issue <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </>
  );
}
