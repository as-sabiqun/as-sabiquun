"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/orders";
import { markInProgressAction } from "@/app/vendor-dashboard/actions";
import type { VendorJobRow } from "@/lib/vendor-orders-types";

const columns: { key: string; label: string; match: (j: VendorJobRow) => boolean }[] = [
  { key: "offered", label: "Awaiting response", match: (j) => j.isOffer },
  { key: "assigned", label: "Accepted", match: (j) => !j.isOffer && j.status === "assigned" },
  { key: "in_progress", label: "In progress", match: (j) => !j.isOffer && ["in_progress", "proof_submitted"].includes(j.status) },
  { key: "completed", label: "Completed", match: (j) => j.status === "completed" },
];

export function BoardReal({ jobs }: { jobs: VendorJobRow[] }) {
  const router = useRouter();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  function handleDrop(columnKey: string) {
    const job = jobs.find((j) => j.order_id === dragId);
    // Only the accepted -> in progress transition is a real, single-click
    // action (mark_in_progress). Every other move needs a form (claim needs
    // the terms checkbox, completion needs photos), so those drops just
    // snap back instead of silently faking a transition.
    if (job && !job.isOffer && job.status === "assigned" && columnKey === "in_progress") {
      markInProgressAction(job.order_id).then(() => router.refresh());
    }
    setDragId(null);
    setOverColumn(null);
  }

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Pipeline</p>
          <h1 className="display vendor-page-title">Kanban board</h1>
          <p className="vendor-page-lead">Drag an accepted job into "In progress" to start work. Claiming and completion happen on the job page.</p>
        </div>
      </div>

      <div className="vendor-kanban">
        {columns.map(({ key, label, match }) => {
          const columnJobs = jobs.filter(match);
          return (
            <div
              key={key}
              className={`vendor-kanban-column ${overColumn === key ? "is-over" : ""}`}
              onDragOver={(event) => { event.preventDefault(); setOverColumn(key); }}
              onDragLeave={() => setOverColumn((current) => (current === key ? null : current))}
              onDrop={() => handleDrop(key)}
            >
              <div className="vendor-kanban-column-head">
                <strong>{label}</strong>
                <span className="catalog-count">{columnJobs.length}</span>
              </div>

              <div className="vendor-kanban-column-body">
                {columnJobs.map((job) => (
                  <Link
                    key={job.order_id}
                    href={`/vendor-dashboard/jobs/${job.order_id}`}
                    className="vendor-kanban-card"
                    draggable
                    onDragStart={() => setDragId(job.order_id)}
                    onDragEnd={() => setDragId(null)}
                  >
                    <span className="vendor-job-table-category">{job.service_type}</span>
                    <strong>{job.title}</strong>
                    <small>{job.reference}</small>
                    <strong className="numeral vendor-kanban-price">{formatCents(job.vendor_payout_amount)}</strong>
                  </Link>
                ))}
                {columnJobs.length === 0 && <p className="vendor-kanban-empty">Drop a job here</p>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
