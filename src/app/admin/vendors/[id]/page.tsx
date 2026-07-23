"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import { useAdminData } from "@/components/admin/admin-data-context";
import { adminJobStatusLabels, vendorServiceOptions } from "@/lib/admin-demo";

export default function AdminVendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { vendors, jobs } = useAdminData();
  const vendor = vendors.find((v) => v.id === id);
  if (!vendor) notFound();

  const vendorJobs = jobs.filter((j) => j.assignedVendorId === vendor.id);

  return (
    <>
      <nav className="breadcrumb">
        <Link href="/admin/vendors">Vendors</Link>
        <span aria-hidden="true">/</span>
        <span>{vendor.name}</span>
      </nav>

      <div className="vendor-detail-layout mt-6">
        <div className="card vendor-panel">
          <div className="vendor-detail-head">
            <div>
              <h1 className="display vendor-page-title">{vendor.name}</h1>
              <p className="vendor-page-lead">{vendor.type} · Vendor since {new Date(vendor.joinedAt).toLocaleDateString()}</p>
            </div>
            <span className={`vendor-status ${vendor.status === "active" ? "vendor-status-accepted" : "vendor-status-rejected"}`}>
              {vendor.status === "active" ? "Active" : "Suspended"}
            </span>
          </div>

          <div className="vendor-stat-grid admin-vendor-stats">
            <div className="admin-inline-stat"><span>Jobs completed</span><strong className="numeral">{vendor.jobsCompleted}</strong></div>
            <div className="admin-inline-stat"><span>Active jobs</span><strong className="numeral">{vendor.jobsActive}</strong></div>
            <div className="admin-inline-stat"><span>Rating</span><strong className="numeral">{vendor.rating > 0 ? vendor.rating.toFixed(1) : "—"}</strong></div>
          </div>

          <div className="mt-8">
            <span className="label mb-3 block">Job history</span>
            {vendorJobs.length === 0 ? (
              <p className="vendor-empty">No jobs assigned yet.</p>
            ) : (
              <div className="vendor-job-list">
                {vendorJobs.map((job) => (
                  <Link key={job.id} href={`/admin/jobs/${job.id}`} className="vendor-job-row">
                    <div>
                      <strong>{job.title}</strong>
                      <small>{job.reference}</small>
                    </div>
                    <div className="vendor-job-row-meta">
                      <span className={`vendor-status ${job.status === "assigned" ? "vendor-status-accepted" : "vendor-status-completed"}`}>
                        {adminJobStatusLabels[job.status]}
                      </span>
                      <strong className="numeral">S${job.price}</strong>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card vendor-panel">
          <span className="vendor-eyebrow">Contact details</span>
          <dl className="admin-contact-facts mt-3">
            <div><dt>Email</dt><dd>{vendor.email}</dd></div>
            <div><dt>Phone</dt><dd>{vendor.phone || "—"}</dd></div>
            <div><dt>Vendor ID</dt><dd>{vendor.id}</dd></div>
          </dl>

          <span className="vendor-eyebrow mt-6 block">Services</span>
          <div className="admin-checkbox-group mt-3">
            {vendorServiceOptions.map((option) => (
              <span key={option.slug} className={`admin-checkbox-pill is-static ${vendor.services.includes(option.slug) ? "is-active" : ""}`}>
                {option.title}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
