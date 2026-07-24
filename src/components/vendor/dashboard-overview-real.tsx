import Link from "next/link";
import { formatCents } from "@/lib/orders";
import { vendorOrderStatusLabel, vendorStatusPillVariant, formatOfferCountdown } from "@/lib/vendor-orders";
import type { VendorJobRow } from "@/lib/vendor-orders-types";

export function DashboardOverviewReal({ jobs }: { jobs: VendorJobRow[] }) {
  const pending = jobs.filter((j) => j.isOffer);
  const active = jobs.filter((j) => !j.isOffer && ["assigned", "in_progress", "proof_submitted"].includes(j.status));
  const completed = jobs.filter((j) => j.status === "completed");
  const earnings = jobs.filter((j) => !j.isOffer).reduce((sum, j) => sum + j.vendor_payout_amount, 0);

  const recent = [...jobs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Overview</p>
          <h1 className="display vendor-page-title">Welcome back</h1>
          <p className="vendor-page-lead">Here's what needs your attention across Korban and Wakaf fulfilment jobs.</p>
        </div>
        <Link href="/vendor-dashboard/jobs" className="btn btn-small">View all jobs <span aria-hidden="true">→</span></Link>
      </div>

      <div className="vendor-stat-grid">
        <div className="card vendor-stat-card">
          <span className="vendor-stat-label">Awaiting response</span>
          <strong className="vendor-stat-value numeral">{pending.length}</strong>
          <span className="vendor-stat-note">{pending.length > 0 ? "Respond before the window closes" : "All caught up"}</span>
        </div>
        <div className="card vendor-stat-card">
          <span className="vendor-stat-label">Active jobs</span>
          <strong className="vendor-stat-value numeral">{active.length}</strong>
          <span className="vendor-stat-note">Accepted and in progress</span>
        </div>
        <div className="card vendor-stat-card">
          <span className="vendor-stat-label">Completed</span>
          <strong className="vendor-stat-value numeral">{completed.length}</strong>
          <span className="vendor-stat-note">All time</span>
        </div>
        <div className="card vendor-stat-card">
          <span className="vendor-stat-label">Earnings tracked</span>
          <strong className="vendor-stat-value numeral">{formatCents(earnings)}</strong>
          <span className="vendor-stat-note">Accepted through completed</span>
        </div>
      </div>

      <div className="vendor-split">
        <div className="card vendor-panel">
          <div className="vendor-panel-head">
            <h2 className="display text-lg">Needs your response</h2>
            <Link href="/vendor-dashboard/jobs">See all <span aria-hidden="true">→</span></Link>
          </div>
          {pending.length === 0 ? (
            <p className="vendor-empty">No jobs waiting on you right now.</p>
          ) : (
            <div className="vendor-job-list">
              {pending.map((job) => {
                const countdown = formatOfferCountdown(job.expires_at!);
                return (
                  <Link key={job.order_id} href={`/vendor-dashboard/jobs/${job.order_id}`} className="vendor-job-row">
                    <div>
                      <strong>{job.title}</strong>
                      <small>{job.reference}</small>
                    </div>
                    <div className="vendor-job-row-meta">
                      <span className={`vendor-countdown ${countdown.urgent ? "is-urgent" : ""}`}>{countdown.label}</span>
                      <strong className="numeral">{formatCents(job.vendor_payout_amount)}</strong>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="card vendor-panel">
          <div className="vendor-panel-head">
            <h2 className="display text-lg">Recent activity</h2>
          </div>
          {recent.length === 0 ? (
            <p className="vendor-empty">Nothing here yet.</p>
          ) : (
            <div className="vendor-job-list">
              {recent.map((job) => (
                <Link key={job.order_id} href={`/vendor-dashboard/jobs/${job.order_id}`} className="vendor-job-row">
                  <div>
                    <strong>{job.title}</strong>
                    <small>{job.reference}</small>
                  </div>
                  <div className="vendor-job-row-meta">
                    <span className={`vendor-status vendor-status-${vendorStatusPillVariant(job.isOffer ? "broadcasting" : job.status)}`}>
                      {job.isOffer ? "Awaiting response" : vendorOrderStatusLabel[job.status]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
