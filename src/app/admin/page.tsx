"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminData } from "@/components/admin/admin-data-context";
import { adminJobStatusLabels, type AdminJobStatus } from "@/lib/admin-demo";

const filters: { label: string; statuses: AdminJobStatus[] | null }[] = [
  { label: "All", statuses: null },
  { label: "Needs assignment", statuses: ["pending"] },
  { label: "Assigned", statuses: ["assigned"] },
  { label: "Completed", statuses: ["completed"] },
];

export default function AdminPendingJobsPage() {
  const { jobs, vendors } = useAdminData();
  const [active, setActive] = useState(filters[0]);

  const pendingCount = jobs.filter((j) => j.status === "pending").length;
  const visible = active.statuses ? jobs.filter((j) => active.statuses!.includes(j.status)) : jobs;
  const sorted = [...visible].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  function vendorName(id?: string) {
    return vendors.find((v) => v.id === id)?.name ?? "—";
  }

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Operations</p>
          <h1 className="display vendor-page-title">Pending jobs</h1>
          <p className="vendor-page-lead">New Korban and Wakaf orders land here first — review each one and assign it to a vendor.</p>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="admin-banner">
          <div>
            <strong>{pendingCount} job{pendingCount === 1 ? "" : "s"} need{pendingCount === 1 ? "s" : ""} assignment</strong>
            <p>Review the brief and assign each to a vendor before its response window opens.</p>
          </div>
        </div>
      )}

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
          sorted.map((job) => (
            <div key={job.id} className="vendor-job-table-row">
              <Link href={`/admin/jobs/${job.id}`} className="vendor-job-table-main">
                <span className="vendor-job-table-category">{job.category}</span>
                <strong>{job.title}</strong>
                <small>{job.reference} · {job.customerName}</small>
              </Link>

              <div className="vendor-job-table-price">
                <strong className="numeral">S${job.price}</strong>
              </div>

              <div className="vendor-job-table-status">
                <span className={`vendor-status vendor-status-${job.status === "pending" ? "pending" : job.status === "assigned" ? "accepted" : "completed"}`}>
                  {adminJobStatusLabels[job.status]}
                </span>
                {job.assignedVendorId && <span className="vendor-countdown">{vendorName(job.assignedVendorId)}</span>}
              </div>

              <Link href={`/admin/jobs/${job.id}`} className="vendor-job-table-view">
                {job.status === "pending" ? "Assign" : "View"} <span aria-hidden="true">→</span>
              </Link>
            </div>
          ))
        )}
      </div>
    </>
  );
}
