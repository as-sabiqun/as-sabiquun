"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useState } from "react";
import { useAdminData } from "@/components/admin/admin-data-context";
import { adminJobStatusLabels, serviceSlugsForCategory } from "@/lib/admin-demo";

export default function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { jobs, vendors, assignJob } = useAdminData();
  const job = jobs.find((j) => j.id === id);
  const [vendorId, setVendorId] = useState("");
  if (!job) notFound();

  const requiredServices = serviceSlugsForCategory(job.category);
  const capableVendors = vendors.filter((v) => v.status === "active" && v.services.some((s) => requiredServices.includes(s)));
  const selectedVendorId = vendorId || capableVendors[0]?.id || "";
  const assignedVendor = vendors.find((v) => v.id === job.assignedVendorId);

  return (
    <>
      <nav className="breadcrumb">
        <Link href="/admin">Pending jobs</Link>
        <span aria-hidden="true">/</span>
        <span>{job.title}</span>
      </nav>

      <div className="vendor-detail-layout mt-6">
        <div className="card vendor-panel">
          <div className="vendor-detail-head">
            <div>
              <span className="vendor-job-table-category">{job.category}</span>
              <h1 className="display vendor-page-title mt-2">{job.title}</h1>
              <p className="vendor-page-lead">{job.reference} · S${job.price}</p>
            </div>
            <span className={`vendor-status vendor-status-${job.status === "pending" ? "pending" : job.status === "assigned" ? "accepted" : "completed"}`}>
              {adminJobStatusLabels[job.status]}
            </span>
          </div>

          <div className="mt-6">
            <span className="label mb-2 block">Job detail</span>
            <p className="text-sm leading-6 text-[var(--muted)]">{job.brief}</p>
          </div>

          <div className="mt-6">
            <span className="label mb-2 block">Requirements</span>
            <ul className="vendor-checklist">
              {job.requirements.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>

        <div className="card vendor-panel vendor-buy-box">
          <span className="vendor-eyebrow">Customer</span>
          <strong className="display text-lg mt-2 block">{job.customerName}</strong>
          <dl className="admin-contact-facts">
            <div><dt>Email</dt><dd>{job.customerEmail}</dd></div>
            <div><dt>Phone</dt><dd>{job.customerPhone}</dd></div>
            <div><dt>Submitted</dt><dd>{new Date(job.submittedAt).toLocaleDateString()}</dd></div>
          </dl>

          {job.status === "pending" && (
            <div className="mt-6 grid gap-3">
              <span className="label">Assign to vendor</span>
              {capableVendors.length === 0 ? (
                <p className="vendor-empty">No active vendor offers this service yet. Add one from the Vendors page.</p>
              ) : (
                <>
                  <select className="input" value={selectedVendorId} onChange={(event) => setVendorId(event.target.value)}>
                    {capableVendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <button type="button" className="btn" disabled={!selectedVendorId} onClick={() => assignJob(job.id, selectedVendorId)}>
                    Assign job <span aria-hidden="true">→</span>
                  </button>
                </>
              )}
            </div>
          )}

          {job.status === "assigned" && assignedVendor && (
            <div className="mt-6">
              <p className="vendor-empty">Assigned to <strong>{assignedVendor.name}</strong>. Waiting on their response and completion.</p>
              <Link href={`/admin/vendors/${assignedVendor.id}`} className="vendor-job-table-view">View vendor <span aria-hidden="true">→</span></Link>
            </div>
          )}

          {job.status === "completed" && (
            <p className="vendor-empty mt-6">Completed{assignedVendor ? ` by ${assignedVendor.name}` : ""}. No further action needed.</p>
          )}
        </div>
      </div>
    </>
  );
}
