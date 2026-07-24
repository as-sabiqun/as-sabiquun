"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useAdminData } from "@/components/admin/admin-data-context";
import { customerStateLabels } from "@/lib/admin-demo";

export function CustomerDetailDemo({ id }: { id: string }) {
  const { customers, jobs } = useAdminData();
  const customer = customers.find((c) => c.id === id);
  if (!customer) notFound();

  const customerJobs = jobs.filter((j) => j.customerEmail === customer.email);

  return (
    <>
      <nav className="breadcrumb">
        <Link href="/admin/customers">Customers</Link>
        <span aria-hidden="true">/</span>
        <span>{customer.name}</span>
      </nav>

      <div className="vendor-detail-layout mt-6">
        <div className="card vendor-panel">
          <div className="vendor-detail-head">
            <div>
              <h1 className="display vendor-page-title">{customer.name}</h1>
              <p className="vendor-page-lead">Customer since {new Date(customer.joinedAt).toLocaleDateString()}</p>
            </div>
            <span className={`vendor-status ${customer.state === "verified" ? "vendor-status-accepted" : customer.state === "pending" ? "vendor-status-pending" : "vendor-status-rejected"}`}>
              {customerStateLabels[customer.state]}
            </span>
          </div>

          <div className="vendor-stat-grid admin-vendor-stats">
            <div className="admin-inline-stat"><span>Orders</span><strong className="numeral">{customer.ordersCount}</strong></div>
            <div className="admin-inline-stat"><span>Lifetime spend</span><strong className="numeral">S${customer.lifetimeSpend.toLocaleString()}</strong></div>
          </div>

          <div className="mt-8">
            <span className="label mb-3 block">Order activity</span>
            {customerJobs.length === 0 ? (
              <p className="vendor-empty">No orders linked to this account in this preview.</p>
            ) : (
              <div className="vendor-job-list">
                {customerJobs.map((job) => (
                  <Link key={job.id} href={`/admin/jobs/${job.id}`} className="vendor-job-row">
                    <div>
                      <strong>{job.title}</strong>
                      <small>{job.reference}</small>
                    </div>
                    <strong className="numeral">S${job.price}</strong>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card vendor-panel">
          <span className="vendor-eyebrow">Contact details</span>
          <dl className="admin-contact-facts mt-3">
            <div><dt>Email</dt><dd>{customer.email}</dd></div>
            <div><dt>Phone</dt><dd>{customer.phone}</dd></div>
            <div><dt>Customer ID</dt><dd>{customer.id}</dd></div>
          </dl>
        </div>
      </div>
    </>
  );
}
