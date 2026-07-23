import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatCents, orderStatusCopy, orderTitle, type OrderRow } from "@/lib/orders";

export default async function DashboardPage() {
  if (!isSupabaseConfigured) {
    return (
      <section className="py-10 lg:py-14">
        <div className="container">
          <p className="vendor-empty">Connect Supabase to see real orders here.</p>
        </div>
      </section>
    );
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/dashboard");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, reference, service_type, category_slug, quantity, participant_names, dedication, total_amount, status, created_at, offerings(title)")
    .eq("customer_id", userData.user.id)
    .order("created_at", { ascending: false });

  const rows = (orders ?? []) as unknown as OrderRow[];

  return (
    <section className="py-10 lg:py-14">
      <div className="container">
        <div>
          <p className="vendor-eyebrow">Account</p>
          <h1 className="display" style={{ fontSize: "clamp(1.5rem, 2.4vw, 1.9rem)" }}>My orders</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Every Korban order and Wakaf contribution you've made, and where it's at.</p>
        </div>

        {rows.length === 0 ? (
          <div className="card mt-8 p-8 text-center">
            <p className="text-sm text-[var(--muted)]">You haven't placed an order yet.</p>
            <Link href="/services" className="btn mt-5">Choose a service <span aria-hidden="true">→</span></Link>
          </div>
        ) : (
          <div className="card vendor-job-table mt-8">
            {rows.map((order) => (
              <Link key={order.id} href={`/dashboard/orders/${order.reference}`} className="vendor-job-table-row">
                <div className="vendor-job-table-main">
                  <span className="vendor-job-table-category">{order.service_type}</span>
                  <strong>{orderTitle(order)}</strong>
                  <small>{order.reference} · {new Date(order.created_at).toLocaleDateString()}</small>
                </div>
                <div className="vendor-job-table-price">
                  <strong className="numeral">{formatCents(order.total_amount)}</strong>
                </div>
                <div className="vendor-job-table-status">
                  <span className={`vendor-status vendor-status-${order.status === "completed" ? "completed" : order.status === "cancelled" || order.status === "expired_unclaimed" ? "rejected" : "pending"}`}>
                    {orderStatusCopy[order.status]}
                  </span>
                </div>
                <span className="vendor-job-table-view">View <span aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
