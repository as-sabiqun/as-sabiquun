"use client";

import Link from "next/link";
import { useVendorData } from "@/components/vendor/vendor-data-context";
import { StatusPill } from "@/components/vendor/status-pill";
import { formatCountdown } from "@/lib/vendor-demo";

export function DashboardOverviewDemo() {
  const { jobs } = useVendorData();

  const pending = jobs.filter((j) => j.status === "pending");
  const active = jobs.filter((j) => j.status === "accepted" || j.status === "in_progress");
  const completed = jobs.filter((j) => j.status === "completed");
  const earnings = jobs.filter((j) => j.status !== "pending" && j.status !== "rejected" && j.status !== "expired").reduce((sum, j) => sum + j.price, 0);

  const recent = [...jobs].sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()).slice(0, 5);

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
          <span className="vendor-stat-note">This preview period</span>
        </div>
        <div className="card vendor-stat-card">
          <span className="vendor-stat-label">Earnings tracked</span>
          <strong className="vendor-stat-value numeral">S${earnings.toLocaleString()}</strong>
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
                const countdown = formatCountdown(job.respondBy);
                return (
                  <Link key={job.id} href={`/vendor-dashboard/jobs/${job.id}`} className="vendor-job-row">
                    <div>
                      <strong>{job.title}</strong>
                      <small>{job.reference} · {job.location}</small>
                    </div>
                    <div className="vendor-job-row-meta">
                      <span className={`vendor-countdown ${countdown.urgent ? "is-urgent" : ""}`}>{countdown.label}</span>
                      <strong className="numeral">S${job.price}</strong>
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
          <div className="vendor-job-list">
            {recent.map((job) => (
              <Link key={job.id} href={`/vendor-dashboard/jobs/${job.id}`} className="vendor-job-row">
                <div>
                  <strong>{job.title}</strong>
                  <small>{job.reference}</small>
                </div>
                <div className="vendor-job-row-meta">
                  <StatusPill status={job.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
