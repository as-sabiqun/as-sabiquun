"use client";

import Link from "next/link";
import { useState } from "react";
import { vendorOrderStatusLabel, vendorStatusPillVariant, formatOfferCountdown } from "@/lib/vendor-orders";
import { formatCents } from "@/lib/orders";
import type { VendorJobRow } from "@/lib/vendor-orders-types";

const filters: { label: string; match: (j: VendorJobRow) => boolean }[] = [
  { label: "All", match: () => true },
  { label: "Awaiting response", match: (j) => j.isOffer },
  { label: "In progress", match: (j) => !j.isOffer && ["assigned", "in_progress", "proof_submitted"].includes(j.status) },
  { label: "Completed", match: (j) => j.status === "completed" },
];

export function JobsListReal({ jobs }: { jobs: VendorJobRow[] }) {
  const [active, setActive] = useState(filters[0]);
  const visible = jobs.filter(active.match);
  const sorted = [...visible].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
            const countdown = job.isOffer ? formatOfferCountdown(job.expires_at!) : null;
            return (
              <div key={job.order_id} className="vendor-job-table-row">
                <Link href={`/vendor-dashboard/jobs/${job.order_id}`} className="vendor-job-table-main">
                  <span className="vendor-job-table-category">{job.service_type}</span>
                  <strong>{job.title}</strong>
                  <small>{job.reference}</small>
                </Link>

                <div className="vendor-job-table-price">
                  <strong className="numeral">{formatCents(job.vendor_payout_amount)}</strong>
                </div>

                <div className="vendor-job-table-status">
                  <span className={`vendor-status vendor-status-${vendorStatusPillVariant(job.isOffer ? "broadcasting" : job.status)}`}>
                    {job.isOffer ? "Awaiting response" : vendorOrderStatusLabel[job.status]}
                  </span>
                  {countdown && <span className={`vendor-countdown ${countdown.urgent ? "is-urgent" : ""}`}>{countdown.label}</span>}
                </div>

                <Link href={`/vendor-dashboard/jobs/${job.order_id}`} className="vendor-job-table-view">
                  {job.isOffer ? "Review & respond" : job.status === "assigned" || job.status === "in_progress" ? "Submit completion" : "View"} <span aria-hidden="true">→</span>
                </Link>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
