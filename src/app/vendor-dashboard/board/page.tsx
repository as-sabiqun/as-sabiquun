"use client";

import { useState } from "react";
import Link from "next/link";
import { useVendorData } from "@/components/vendor/vendor-data-context";
import { kanbanStatuses, type JobStatus } from "@/lib/vendor-demo";

export default function VendorBoardPage() {
  const { jobs, setJobStatus } = useVendorData();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<JobStatus | null>(null);

  const boardJobs = jobs.filter((j) => kanbanStatuses.some((c) => c.status === j.status));

  function handleDrop(status: JobStatus) {
    if (dragId) setJobStatus(dragId, status);
    setDragId(null);
    setOverColumn(null);
  }

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Pipeline</p>
          <h1 className="display vendor-page-title">Kanban board</h1>
          <p className="vendor-page-lead">Drag a job card to move it through your fulfilment pipeline.</p>
        </div>
      </div>

      <div className="vendor-kanban">
        {kanbanStatuses.map(({ status, label }) => {
          const columnJobs = boardJobs.filter((j) => j.status === status);
          return (
            <div
              key={status}
              className={`vendor-kanban-column ${overColumn === status ? "is-over" : ""}`}
              onDragOver={(event) => { event.preventDefault(); setOverColumn(status); }}
              onDragLeave={() => setOverColumn((current) => (current === status ? null : current))}
              onDrop={() => handleDrop(status)}
            >
              <div className="vendor-kanban-column-head">
                <strong>{label}</strong>
                <span className="catalog-count">{columnJobs.length}</span>
              </div>

              <div className="vendor-kanban-column-body">
                {columnJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/vendor-dashboard/jobs/${job.id}`}
                    className="vendor-kanban-card"
                    draggable
                    onDragStart={() => setDragId(job.id)}
                    onDragEnd={() => setDragId(null)}
                  >
                    <span className="vendor-job-table-category">{job.category}</span>
                    <strong>{job.title}</strong>
                    <small>{job.reference}</small>
                    <strong className="numeral vendor-kanban-price">S${job.price}</strong>
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
