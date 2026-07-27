import Link from "next/link";
import { AdminJobsTable, type AdminLifecycleOrder } from "@/components/admin/operations-jobs";
import { adminActionQueueKeys, jobStageForOrder, queueForOrder, queueMeta, type AdminJobStage, type AdminQueueKey } from "@/app/admin/operations";
import { createClient } from "@/lib/supabase/server";

const queueKeys = Object.keys(queueMeta) as AdminQueueKey[];
const stageMeta: Record<AdminJobStage, { label: string; color: string }> = {
  payment: { label: "Payment", color: "#A27C47" },
  fulfilment: { label: "Work in progress", color: "#1D737F" },
  review: { label: "Review and send", color: "#758F96" },
  completed: { label: "Completed", color: "#5E826F" },
  cancelled: { label: "Cancelled / refunded", color: "#A64B3C" },
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminJobsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; queue?: string | string[] }> }) {
  const params = await searchParams;
  const query = (one(params.q) ?? "").trim().slice(0, 80);
  const requestedQueue = one(params.queue);
  const queue = queueKeys.includes(requestedQueue as AdminQueueKey) ? requestedQueue as AdminQueueKey : null;
  const supabase = await createClient();

  let ids: string[] | null = null;
  if (query) {
    const pattern = `%${query}%`;
    const [{ data: references }, { data: customers }, { data: emails }, { data: vendors }] = await Promise.all([
      supabase.from("orders").select("id").ilike("reference", pattern).limit(100),
      supabase.from("orders").select("id").ilike("customer_name", pattern).limit(100),
      supabase.from("orders").select("id").ilike("customer_email", pattern).limit(100),
      supabase.from("profiles").select("id").eq("role", "vendor").ilike("display_name", pattern).limit(100),
    ]);
    const vendorIds = (vendors ?? []).map((vendor) => vendor.id);
    const { data: vendorOrders } = vendorIds.length
      ? await supabase.from("orders").select("id").in("assigned_vendor_id", vendorIds).limit(100)
      : { data: [] as { id: string }[] };
    ids = [...new Set([...(references ?? []), ...(customers ?? []), ...(emails ?? []), ...(vendorOrders ?? [])].map((row) => row.id))];
  }

  let request = supabase
    .from("orders")
    .select(`id, reference, service_type, category_slug, quantity, participant_names, dedication, total_amount,
      vendor_payout_amount, status, payment_status, fulfilment_status, delivery_status, settlement_status,
      customer_name, customer_email, broadcast_started_at, broadcast_expires_at, refund_fulfilment_resolution, created_at, updated_at,
      offering_title, offerings(title), assigned_vendor:profiles!orders_assigned_vendor_id_fkey(id, display_name)`)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (ids) request = request.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const { data, error } = await request;
  const all = (data ?? []) as unknown as AdminLifecycleOrder[];
  const orders = queue ? all.filter((order) => queueForOrder(order) === queue) : all;
  const queueCounts = Object.fromEntries(queueKeys.map((key) => [key, all.filter((order) => queueForOrder(order) === key).length])) as Record<AdminQueueKey, number>;
  const stageCounts = Object.fromEntries(Object.keys(stageMeta).map((key) => [key, all.filter((order) => jobStageForOrder(order) === key).length])) as Record<AdminJobStage, number>;
  const stageKeys = Object.keys(stageMeta) as AdminJobStage[];
  let stageOffset = 0;
  const stageSegments = stageKeys.map((key) => {
    const share = all.length ? stageCounts[key] / all.length * 100 : 0;
    const segment = { key, share, offset: -stageOffset };
    stageOffset += share;
    return segment;
  });
  const activeQueueKeys = adminActionQueueKeys.filter((key) => queueCounts[key] > 0);
  const attentionTotal = activeQueueKeys.reduce((sum, key) => sum + queueCounts[key], 0);
  const queueHref = (key?: AdminQueueKey) => `/admin/jobs?${new URLSearchParams({ ...(key ? { queue: key } : {}), ...(query ? { q: query } : {}) })}`;

  return (
    <>
      <div className="vendor-page-head">
        <div><p className="vendor-eyebrow">All projects</p><h1 className="display vendor-page-title">Jobs</h1><p className="vendor-page-lead">Start with your next actions, or open any job to see its full history.</p></div>
      </div>

      <section className="admin-jobs-dashboard" aria-label="Job overview">
        <div className="admin-jobs-mix">
          <header><div><span className="vendor-eyebrow">Status</span><h2>Where projects stand</h2></div><Link href={queueHref()} className={!queue ? "is-active" : ""}>View all</Link></header>
          <div className="admin-jobs-mix-body">
            <div className="admin-jobs-donut">
              <svg viewBox="0 0 100 100" role="img" aria-label={`${all.length} jobs grouped by lifecycle stage`}>
                <circle className="admin-jobs-donut-track" cx="50" cy="50" r="41" pathLength="100" />
                {stageSegments.filter((segment) => segment.share > 0).map((segment) => <circle key={segment.key} cx="50" cy="50" r="41" pathLength="100" stroke={stageMeta[segment.key].color} strokeDasharray={`${segment.share} ${100 - segment.share}`} strokeDashoffset={segment.offset} />)}
              </svg>
              <div><strong className="display numeral">{all.length}</strong><span>Total jobs</span></div>
            </div>
            <dl className="admin-jobs-legend">{stageKeys.map((key) => <div key={key}><dt><i style={{ background: stageMeta[key].color }} />{stageMeta[key].label}</dt><dd>{stageCounts[key]}</dd></div>)}</dl>
          </div>
        </div>

        <div className="admin-jobs-attention">
          <header><div><span className="vendor-eyebrow">To do</span><h2>Your next actions</h2></div><strong className="display numeral">{attentionTotal}</strong></header>
          {activeQueueKeys.length ? <div>{activeQueueKeys.map((key) => <Link key={key} href={queueHref(key)} className={queue === key ? "is-active" : ""} data-queue={key}><i /><span><strong>{queueMeta[key].label}</strong><small>{queueMeta[key].help}</small></span><b>{queueCounts[key]}</b></Link>)}</div> : <div className="admin-jobs-clear"><span aria-hidden="true">✓</span><strong>All caught up</strong><p>There are no admin tasks waiting.</p></div>}
        </div>
      </section>

      <form action="/admin/jobs" className="admin-jobs-toolbar" role="search">
        {queue && <input type="hidden" name="queue" value={queue} />}
        <label className="admin-directory-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <span className="sr-only">Search jobs</span>
          <input name="q" type="search" defaultValue={query} placeholder="Search reference, customer, or vendor..." />
        </label>
        <button className="btn btn-small" type="submit">Search</button>
        {(query || queue) && <Link className="btn btn-secondary btn-small" href="/admin/jobs">Clear</Link>}
      </form>

      <div className="admin-jobs-results-head"><div><span className="vendor-eyebrow">Register</span><h2>{queue ? queueMeta[queue].label : query ? "Search results" : "All jobs"}</h2></div><span>{orders.length} shown</span></div>
      {error ? <p className="auth-error">Jobs could not be loaded: {error.message}</p> : <AdminJobsTable orders={orders} />}
    </>
  );
}
