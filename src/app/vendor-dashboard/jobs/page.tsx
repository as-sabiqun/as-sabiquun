"use client";

import Link from "next/link";
import { useState } from "react";
import { useVendorData } from "@/components/vendor/vendor-data-context";
import { StatusPill } from "@/components/vendor/status-pill";
import { formatCountdown, type JobStatus } from "@/lib/vendor-demo";

const filters: { label: string; statuses: JobStatus[] | null }[] = [
  { label: "All", statuses: null },
  { label: "Awaiting response", statuses: ["pending"] },
  { label: "Accepted", statuses: ["accepted"] },
  { label: "In progress", statuses: ["in_progress"] },
  { label: "Completed", statuses: ["completed"] },
  { label: "Closed", statuses: ["rejected", "expired"] },
];

export default function VendorJobsPage() {
  const { jobs, setJobStatus } = useVendorData();
  const [active, setActive] = useState(filters[0]);

  const visible = active.statuses ? jobs.filter((j) => active.statuses!.includes(j.status)) : jobs;
  const sorted = [...visible].sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Jobs</p>
          <h1 className="display vendor-page-title">All jobs</h1>
          <p className="vendor-page-lead">Accept or decline fulfilment jobs before the response window closes.</p>
        </div>
      </div>

      <div className="vendor-filter-tabs">
        {filters.map((f) => (
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
          sorted.map((job) => {
            const countdown = formatCountdown(job.respondBy);
            return (
              <div key={job.id} className="vendor-job-table-row">
                <Link href={`/vendor-dashboard/jobs/${job.id}`} className="vendor-job-table-main">
                  <span className="vendor-job-table-category">{job.category}</span>
                  <strong>{job.title}</strong>
                  <small>{job.reference} · {job.location}</small>
                </Link>

                <div className="vendor-job-table-price">
                  <strong className="numeral">S${job.price}</strong>
                </div>

                <div className="vendor-job-table-status">
                  <StatusPill status={job.status} />
                  {job.status === "pending" && (
                    <span className={`vendor-countdown ${countdown.urgent ? "is-urgent" : ""}`}>{countdown.label}</span>
                  )}
                </div>

                {job.status === "pending" ? (
                  <div className="vendor-job-table-actions">
                    <button type="button" className="btn-small btn-accept" onClick={() => setJobStatus(job.id, "accepted")}>Accept</button>
                    <button type="button" className="btn-small btn-reject" onClick={() => setJobStatus(job.id, "rejected")}>Reject</button>
                  </div>
                ) : (
                  <Link href={`/vendor-dashboard/jobs/${job.id}`} className="vendor-job-table-view">View <span aria-hidden="true">→</span></Link>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
