import Link from "next/link";
import { AdminJobsTable, type AdminLifecycleOrder } from "@/components/admin/operations-jobs";
import { queueForOrder, queueMeta, type AdminQueueKey } from "@/app/admin/operations";
import { createClient } from "@/lib/supabase/server";

const queueOrder: AdminQueueKey[] = ["payment_issue", "ready", "unclaimed", "review", "delivery_failed", "settlement", "fulfilment"];

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`id, reference, service_type, category_slug, quantity, participant_names, dedication, total_amount,
      vendor_payout_amount, status, payment_status, fulfilment_status, delivery_status, settlement_status,
      customer_name, customer_email, broadcast_started_at, broadcast_expires_at, refund_fulfilment_resolution, created_at, updated_at,
      offering_title, offerings(title), assigned_vendor:profiles!orders_assigned_vendor_id_fkey(id, display_name)`)
    .order("updated_at", { ascending: false })
    .limit(500);

  const orders = (data ?? []) as unknown as AdminLifecycleOrder[];
  const queues = Object.fromEntries(queueOrder.map((key) => [key, orders.filter((order) => queueForOrder(order) === key)])) as Record<AdminQueueKey, AdminLifecycleOrder[]>;
  const actionCount = queueOrder.filter((key) => key !== "fulfilment").reduce((sum, key) => sum + queues[key].length, 0);
  const paidVolume = orders.filter((order) => ["paid", "partially_refunded"].includes(order.payment_status)).reduce((sum, order) => sum + order.total_amount, 0);

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

      <div className="vendor-stat-grid">
        <div className="card vendor-stat-card"><span className="vendor-stat-label">Needs action</span><strong className="display vendor-stat-value">{actionCount}</strong><span className="vendor-stat-note">Across payment, review, delivery, and settlement</span></div>
        <div className="card vendor-stat-card"><span className="vendor-stat-label">In fulfilment</span><strong className="display vendor-stat-value">{queues.fulfilment.length}</strong><span className="vendor-stat-note">Actively with partners</span></div>
        <div className="card vendor-stat-card"><span className="vendor-stat-label">Gross paid orders</span><strong className="display vendor-stat-value">S${(paidVolume / 100).toLocaleString()}</strong><span className="vendor-stat-note">Order value before any refund</span></div>
        <div className="card vendor-stat-card"><span className="vendor-stat-label">Closed</span><strong className="display vendor-stat-value">{orders.filter((order) => order.settlement_status === "paid" && order.delivery_status === "delivered" && order.fulfilment_status === "verified").length}</strong><span className="vendor-stat-note">Delivered and fully settled</span></div>
      </div>

      <section className="card vendor-panel">
        <div className="vendor-panel-head"><div><p className="vendor-eyebrow">Next-action queue</p><h2 className="display text-lg mt-1">What needs attention</h2></div></div>
        <div className="admin-evidence-summary">
          {queueOrder.map((key) => (
            <div key={key} className={queues[key].length ? "is-complete" : ""}>
              <Link href={`/admin/jobs?queue=${key}`} className="grid gap-1">
                <span>{queueMeta[key].label}</span><strong>{queues[key].length}</strong><small>{queueMeta[key].help}</small>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="vendor-panel-head"><div><p className="vendor-eyebrow">Priority</p><h2 className="display text-lg mt-1">Newest actions</h2></div><Link href="/admin/jobs">Open job register</Link></div>
        <AdminJobsTable orders={queueOrder.flatMap((key) => queues[key]).slice(0, 8)} empty="No operational actions are waiting." />
      </section>
    </>
  );
}
