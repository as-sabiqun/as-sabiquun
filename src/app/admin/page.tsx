import Link from "next/link";
import { queueForOrder, queueMeta, type AdminQueueKey } from "@/app/admin/operations";
import { AdminJobsTable, type AdminLifecycleOrder } from "@/components/admin/operations-jobs";
import { DashboardLineChart } from "@/components/dashboard/dashboard-charts";
import { buildMonthlyMetricSeries } from "@/lib/dashboard-analytics";
import { createClient } from "@/lib/supabase/server";

const queueOrder: AdminQueueKey[] = ["payment_issue", "ready", "unclaimed", "review", "delivery_failed", "settlement", "fulfilment"];

interface AdminOverviewOrder extends AdminLifecycleOrder {
  payment_confirmed_at: string | null;
  admin_verified_at: string | null;
  completed_at: string | null;
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`id, reference, service_type, category_slug, quantity, participant_names, dedication, total_amount,
      vendor_payout_amount, status, payment_status, fulfilment_status, delivery_status, settlement_status,
      customer_name, customer_email, broadcast_started_at, broadcast_expires_at, refund_fulfilment_resolution, created_at, updated_at,
      payment_confirmed_at, admin_verified_at, completed_at,
      offering_title, offerings(title), assigned_vendor:profiles!orders_assigned_vendor_id_fkey(id, display_name)`)
    .order("updated_at", { ascending: false })
    .limit(500);

  const orders = (data ?? []) as unknown as AdminOverviewOrder[];
  const queues = Object.fromEntries(queueOrder.map((key) => [key, orders.filter((order) => queueForOrder(order) === key)])) as unknown as Record<AdminQueueKey, AdminLifecycleOrder[]>;
  const actionCount = queueOrder.filter((key) => key !== "fulfilment").reduce((sum, key) => sum + queues[key].length, 0);
  const paidVolume = orders.filter((order) => ["paid", "partially_refunded"].includes(order.payment_status)).reduce((sum, order) => sum + order.total_amount, 0);
  const closedCount = orders.filter((order) => order.settlement_status === "paid" && order.delivery_status === "delivered" && order.fulfilment_status === "verified").length;
  const activeQueues = queueOrder.filter((key) => queues[key].length > 0);
  const throughput = buildMonthlyMetricSeries(["paid", "verified"], orders.flatMap((order) => [
    ...(["paid", "partially_refunded"].includes(order.payment_status) ? [{ metric: "paid", occurredAt: order.payment_confirmed_at ?? order.created_at }] : []),
    ...(order.fulfilment_status === "verified" ? [{ metric: "verified", occurredAt: order.admin_verified_at ?? order.completed_at ?? order.updated_at }] : []),
  ]));

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Amanah operations</p>
          <h1 className="display vendor-page-title">Overview</h1>
          <p className="vendor-page-lead">Work from the exception queue. Every state below is derived from provider results and controlled lifecycle transitions.</p>
        </div>
        <Link href="/admin/jobs" className="btn btn-small">View all jobs <span aria-hidden="true">→</span></Link>
      </div>

      {error && <p className="auth-error">Operational data could not be loaded: {error.message}</p>}

      <section className="admin-overview-grid" aria-label="Operational performance">
        <DashboardLineChart
          id="admin-throughput"
          eyebrow="Six-month movement"
          title="Paid work moving into verification"
          description="Monthly provider-confirmed orders compared with projects approved after evidence review."
          points={throughput}
          series={[
            { key: "paid", label: "Paid orders", color: "#1d737f" },
            { key: "verified", label: "Verified projects", color: "#a27c47" },
          ]}
        />
        <aside className="admin-overview-pulse">
          <header><span className="vendor-eyebrow">Live position</span><h2>Operational pulse</h2></header>
          <dl>
            <div><dt>Needs action</dt><dd>{actionCount}</dd><small>Exceptions to resolve</small></div>
            <div><dt>In fulfilment</dt><dd>{queues.fulfilment.length}</dd><small>Currently with partners</small></div>
            <div><dt>Gross paid value</dt><dd>S${(paidVolume / 100).toLocaleString()}</dd><small>Before any refund</small></div>
            <div><dt>Closed</dt><dd>{closedCount}</dd><small>Delivered and settled</small></div>
          </dl>
        </aside>
      </section>

      <section className="admin-overview-actions">
        <header><div><p className="vendor-eyebrow">Next-action queue</p><h2 className="display text-lg mt-1">What needs attention</h2></div><Link href="/admin/jobs">Open full queue →</Link></header>
        {activeQueues.length ? <div>{activeQueues.map((key) => (
          <Link key={key} href={`/admin/jobs?queue=${key}`} data-queue={key}>
            <i /><span><strong>{queueMeta[key].label}</strong><small>{queueMeta[key].help}</small></span><b>{queues[key].length}</b>
          </Link>
        ))}</div> : <div className="admin-overview-clear"><span aria-hidden="true">✓</span><strong>No intervention needed</strong><small>Every operational exception is clear.</small></div>}
      </section>

      <section>
        <div className="vendor-panel-head"><div><p className="vendor-eyebrow">Priority</p><h2 className="display text-lg mt-1">Newest actions</h2></div><Link href="/admin/jobs">Open job register</Link></div>
        <AdminJobsTable orders={queueOrder.flatMap((key) => queues[key]).slice(0, 8)} empty="No operational actions are waiting." />
      </section>
    </>
  );
}
