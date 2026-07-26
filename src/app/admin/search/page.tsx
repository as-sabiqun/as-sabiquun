import Link from "next/link";
import { AdminJobsTable, type AdminLifecycleOrder } from "@/components/admin/operations-jobs";
import { createClient } from "@/lib/supabase/server";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const query = (one((await searchParams).q) ?? "").trim().slice(0, 80);
  if (!query) return <div className="card vendor-panel"><p className="vendor-eyebrow">Search</p><h1 className="display vendor-page-title">Find an operational record</h1><p className="vendor-page-lead">Search by job reference, customer name, or vendor name.</p><form action="/admin/search" className="flex gap-3 mt-5" role="search"><input className="input" name="q" type="search" aria-label="Search operational records" required placeholder="Reference, customer, or vendor" /><button className="btn btn-small">Search</button></form></div>;

  const supabase = await createClient();
  const pattern = `%${query}%`;
  const [{ data: profiles, error: profileError }, { data: referenceMatches }, { data: customerMatches }, { data: emailMatches }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, role, phone, status, vendor_onboarding_status").in("role", ["customer", "vendor"]).ilike("display_name", pattern).limit(50),
    supabase.from("orders").select("id").ilike("reference", pattern).limit(100),
    supabase.from("orders").select("id").ilike("customer_name", pattern).limit(100),
    supabase.from("orders").select("id").ilike("customer_email", pattern).limit(100),
  ]);
  const vendors = (profiles ?? []).filter((profile) => profile.role === "vendor");
  const customers = (profiles ?? []).filter((profile) => profile.role === "customer");
  const { data: vendorOrders } = vendors.length ? await supabase.from("orders").select("id").in("assigned_vendor_id", vendors.map((vendor) => vendor.id)).limit(100) : { data: [] as { id: string }[] };
  const ids = [...new Set([...(referenceMatches ?? []), ...(customerMatches ?? []), ...(emailMatches ?? []), ...(vendorOrders ?? [])].map((row) => row.id))];
  const { data: orderData, error: orderError } = ids.length ? await supabase
    .from("orders")
    .select(`id, reference, service_type, category_slug, quantity, participant_names, dedication, total_amount,
      vendor_payout_amount, status, payment_status, fulfilment_status, delivery_status, settlement_status,
      customer_name, customer_email, broadcast_started_at, broadcast_expires_at, created_at, updated_at,
      offering_title, offerings(title), assigned_vendor:profiles!orders_assigned_vendor_id_fkey(id, display_name)`)
    .in("id", ids).order("updated_at", { ascending: false }) : { data: [] as unknown[], error: null };
  const orders = (orderData ?? []) as unknown as AdminLifecycleOrder[];

  return (
    <>
      <div className="vendor-page-head"><div><p className="vendor-eyebrow">Global search</p><h1 className="display vendor-page-title">Results for “{query}”</h1><p className="vendor-page-lead">Jobs, customers, and fulfilment partners from the secured operations record.</p></div></div>
      <form action="/admin/search" className="card vendor-panel flex gap-3" role="search"><input className="input" name="q" type="search" aria-label="Search operational records" required defaultValue={query} /><button className="btn btn-small">Search</button></form>
      {(profileError || orderError) && <p className="auth-error">Some results could not be loaded. {(profileError || orderError)?.message}</p>}

      <section><div className="vendor-panel-head"><h2 className="display text-lg">Jobs ({orders.length})</h2></div><AdminJobsTable orders={orders} empty="No matching jobs." /></section>

      <div className="vendor-split">
        <section className="card vendor-panel">
          <div className="vendor-panel-head"><h2 className="display text-lg">Vendors ({vendors.length})</h2></div>
          {vendors.length === 0 ? <p className="vendor-empty">No matching vendors.</p> : <div className="vendor-job-list">{vendors.map((vendor) => <Link key={vendor.id} href={`/admin/vendors/${vendor.id}`} className="vendor-job-row"><div><strong>{vendor.display_name}</strong><small>{vendor.phone || "No phone"}</small></div><span className="vendor-job-table-view">Open →</span></Link>)}</div>}
        </section>
        <section className="card vendor-panel">
          <div className="vendor-panel-head"><h2 className="display text-lg">Customers ({customers.length})</h2></div>
          {customers.length === 0 ? <p className="vendor-empty">No matching customers.</p> : <div className="vendor-job-list">{customers.map((customer) => <Link key={customer.id} href={`/admin/customers/${customer.id}`} className="vendor-job-row"><div><strong>{customer.display_name}</strong><small>{customer.phone || "No phone"}</small></div><span className="vendor-job-table-view">Open →</span></Link>)}</div>}
        </section>
      </div>
    </>
  );
}
