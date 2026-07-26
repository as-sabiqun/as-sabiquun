import Link from "next/link";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { formatCents } from "@/lib/orders";

interface EarningsOrder {
  id: string;
  reference: string;
  vendor_payout_amount: number;
  fulfilment_status: string;
  settlement_status: string;
  offering_title: string;
}

interface PaymentRow {
  order_id: string;
  amount: number;
  reference: string | null;
  payment_date: string;
}

export default async function VendorEarningsPage() {
  const supabase = await createClient();
  const vendorId = (await getCurrentUser(supabase))!.id;
  const [{ data: orderData, error: orderError }, { data: paymentData, error: paymentError }] = await Promise.all([
    supabase
      .from("vendor_assigned_orders")
      .select("id, reference, vendor_payout_amount, fulfilment_status, settlement_status, offering_title")
      .order("created_at", { ascending: false }),
    supabase
      .from("vendor_payments")
      .select("order_id, amount, reference, payment_date")
      .eq("vendor_id", vendorId)
      .order("payment_date", { ascending: false }),
  ]);
  if (orderError || paymentError) throw new Error("Earnings could not be loaded.");
  const orders = (orderData ?? []) as unknown as EarningsOrder[];
  const payments = (paymentData ?? []) as PaymentRow[];
  const paidByOrder = new Map<string, number>();
  payments.forEach((payment) => paidByOrder.set(payment.order_id, (paidByOrder.get(payment.order_id) ?? 0) + payment.amount));

  const committed = orders.reduce((sum, order) => sum + order.vendor_payout_amount, 0);
  const pendingVerification = orders.filter((order) => order.fulfilment_status !== "verified").reduce((sum, order) => sum + order.vendor_payout_amount, 0);
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const payable = orders.filter((order) => order.fulfilment_status === "verified").reduce((sum, order) => sum + Math.max(0, order.vendor_payout_amount - (paidByOrder.get(order.id) ?? 0)), 0);

  return (
    <>
      <div className="vendor-page-head">
        <div><p className="vendor-eyebrow">Finance</p><h1 className="display vendor-page-title">Earnings</h1><p className="vendor-page-lead">A transparent SGD ledger for assigned, verified, payable, and paid work.</p></div>
      </div>

      <div className="vendor-stat-grid">
        <Metric label="Committed" value={committed} note="All work assigned to you" />
        <Metric label="Pending verification" value={pendingVerification} note="Work not yet approved" />
        <Metric label="Payable" value={payable} note="Verified and outstanding" />
        <Metric label="Paid" value={paid} note="Net of recorded reversals" />
      </div>

      <section className="card vendor-panel mt-5">
        <div className="vendor-panel-head"><div><p className="vendor-eyebrow">By project</p><h2 className="display text-lg">Settlement ledger</h2></div></div>
        {orders.length === 0 ? <p className="vendor-empty">No assigned jobs yet.</p> : (
          <div className="vendor-job-table">
            {orders.map((order) => {
              const orderPaid = paidByOrder.get(order.id) ?? 0;
              const outstanding = Math.max(0, order.vendor_payout_amount - orderPaid);
              return (
                <div key={order.id} className="vendor-job-table-row">
                  <Link href={`/vendor-dashboard/jobs/${order.id}`} className="vendor-job-table-main"><strong>{order.offering_title || "Service project"}</strong><small>{order.reference}</small></Link>
                  <div className="vendor-job-table-price"><strong className="numeral">{formatCents(order.vendor_payout_amount)}</strong></div>
                  <div className="vendor-job-table-status"><span className={`vendor-status ${outstanding === 0 ? "vendor-status-completed" : order.fulfilment_status === "verified" ? "vendor-status-accepted" : "vendor-status-pending"}`}>{outstanding === 0 ? "Paid" : order.fulfilment_status === "verified" ? "Payable" : "Pending verification"}</span></div>
                  <div className="admin-list-stats"><span>{formatCents(orderPaid)} paid</span><span>{formatCents(outstanding)} outstanding</span></div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function Metric({ label, value, note }: { label: string; value: number; note: string }) {
  return <div className="card vendor-stat-card"><span className="vendor-stat-label">{label}</span><strong className="vendor-stat-value numeral">{formatCents(value)}</strong><span className="vendor-stat-note">{note}</span></div>;
}
