import Link from "next/link";
import { DashboardDonut, DashboardLineChart } from "@/components/dashboard/dashboard-charts";
import { buildMonthlyMetricSeries } from "@/lib/dashboard-analytics";
import { formatCents } from "@/lib/orders";
import { vendorJobMilestone, vendorOrderStatusLabel, vendorStatusPillVariant, formatOfferCountdown } from "@/lib/vendor-orders";
import type { VendorJobRow } from "@/lib/vendor-orders-types";

export function DashboardOverviewReal({ jobs }: { jobs: VendorJobRow[] }) {
  const pending = jobs.filter((job) => job.isOffer);
  const inProgress = jobs.filter((job) => !job.isOffer && ["assigned", "in_progress", "revision_required"].includes(job.fulfilment_status));
  const review = jobs.filter((job) => !job.isOffer && job.fulfilment_status === "proof_submitted");
  const completed = jobs.filter((job) => !job.isOffer && job.fulfilment_status === "verified");
  const active = [...inProgress, ...review];
  const earnings = jobs.filter((job) => !job.isOffer && job.fulfilment_status !== "cancelled").reduce((sum, job) => sum + job.vendor_payout_amount, 0);
  const assignedFlow = buildMonthlyMetricSeries(["assigned"], jobs.filter((job) => !job.isOffer).map((job) => ({ metric: "assigned", occurredAt: job.created_at })));
  const recent = [...jobs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Overview</p>
          <h1 className="display vendor-page-title">Welcome back</h1>
          <p className="vendor-page-lead">See new offers, ongoing projects, and work already approved by As-Sābiqūn.</p>
        </div>
        <Link href="/vendor-dashboard/jobs" className="btn btn-small">View all jobs <span aria-hidden="true">→</span></Link>
      </div>

      <section className="vendor-dashboard-analytics" aria-label="Vendor work analytics">
        <DashboardLineChart
          id="vendor-assignment-flow"
          eyebrow="Six-month movement"
          title="Work assigned over time"
          description="New projects allocated to your organisation each month."
          points={assignedFlow}
          series={[{ key: "assigned", label: "Assigned projects", color: "#1d737f" }]}
        />
        <DashboardDonut
          id="vendor-work-mix"
          eyebrow="Project status"
          title="Where your projects stand"
          description="New offers and assigned projects grouped by their current status."
          centerLabel="projects"
          segments={[
            { label: "Offers", value: pending.length, color: "#a27c47" },
            { label: "In progress", value: inProgress.length, color: "#1d737f" },
            { label: "In review", value: review.length, color: "#ad90c7" },
            { label: "Approved", value: completed.length, color: "#5e826f" },
          ]}
        />
      </section>

      <dl className="vendor-dashboard-ledger" aria-label="Vendor summary">
        <div><dt>Awaiting response</dt><dd>{pending.length}</dd><small>{pending.length ? "Respond before expiry" : "All caught up"}</small></div>
        <div><dt>Active work</dt><dd>{active.length}</dd><small>In progress or review</small></div>
        <div><dt>Approved</dt><dd>{completed.length}</dd><small>Work accepted by admin</small></div>
        <div><dt>Total earnings</dt><dd>{formatCents(earnings)}</dd><small>Across assigned projects</small></div>
      </dl>

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
                    <div><strong>{job.title}</strong><small>{job.reference}</small></div>
                    <div className="vendor-job-row-meta"><span className={`vendor-countdown ${countdown.urgent ? "is-urgent" : ""}`}>{countdown.label}</span><strong className="numeral">{formatCents(job.vendor_payout_amount)}</strong></div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="card vendor-panel">
          <div className="vendor-panel-head"><h2 className="display text-lg">Recent activity</h2></div>
          {recent.length === 0 ? (
            <p className="vendor-empty">Assigned work and offers will appear here.</p>
          ) : (
            <div className="vendor-job-list">
              {recent.map((job) => (
                <Link key={job.order_id} href={`/vendor-dashboard/jobs/${job.order_id}`} className="vendor-job-row">
                  <div><strong>{job.title}</strong><small>{job.reference}</small></div>
                  <div className="vendor-job-row-meta"><span className={`vendor-status vendor-status-${vendorStatusPillVariant(vendorJobMilestone(job))}`}>{job.isOffer ? "Awaiting response" : vendorOrderStatusLabel(job)}</span></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
