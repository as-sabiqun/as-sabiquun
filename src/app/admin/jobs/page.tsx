import Link from "next/link";
import { AdminJobsTable, type AdminLifecycleOrder } from "@/components/admin/operations-jobs";
import { queueForOrder, queueMeta, type AdminQueueKey } from "@/app/admin/operations";
import { createClient } from "@/lib/supabase/server";

const queueKeys = Object.keys(queueMeta) as AdminQueueKey[];

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

  return (
    <>
      <div className="vendor-page-head">
        <div><p className="vendor-eyebrow">Operations register</p><h1 className="display vendor-page-title">Jobs</h1><p className="vendor-page-lead">Search customer, partner, or job reference and inspect each independent workflow axis.</p></div>
      </div>

      <form action="/admin/jobs" className="card vendor-panel" role="search">
        <div className="admin-form-grid">
          <label className="label">Search<input className="input" name="q" type="search" defaultValue={query} placeholder="Job reference, customer, or vendor" /></label>
          <label className="label">Action queue<select className="input" name="queue" defaultValue={queue ?? ""}><option value="">All jobs</option>{queueKeys.map((key) => <option key={key} value={key}>{queueMeta[key].label}</option>)}</select></label>
        </div>
        <div className="flex gap-3 mt-4"><button className="btn btn-small" type="submit">Apply filters</button>{(query || queue) && <Link className="btn btn-secondary btn-small" href="/admin/jobs">Clear</Link>}</div>
      </form>

      <div className="vendor-panel-head"><strong>{orders.length} job{orders.length === 1 ? "" : "s"}</strong>{queue && <span className="vendor-status vendor-status-pending">{queueMeta[queue].label}</span>}</div>
      {error ? <p className="auth-error">Jobs could not be loaded: {error.message}</p> : <AdminJobsTable orders={orders} />}
    </>
  );
}
