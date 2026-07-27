import { FinanceReal, type ProviderTransactionRow, type RefundableOrder, type SettlementOrder, type VendorLedgerRow } from "@/components/admin/finance-real";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/orders";

export default async function AdminFinancePage() {
  const supabase = await createClient();
  const [
    { data: orderData, error: orderError },
    { data: paymentData, error: paymentError },
    { data: transactionData, error: transactionError },
    { data: refundableData, error: refundableError },
    { data: refundData, error: refundError },
  ] = await Promise.all([
    supabase.from("orders").select(`id, reference, customer_name, vendor_payout_amount, settlement_status,
      assigned_vendor:profiles!orders_assigned_vendor_id_fkey(id, display_name)`)
      .eq("fulfilment_status", "verified").neq("settlement_status", "paid").order("created_at", { ascending: true }),
    supabase.from("vendor_payments").select(`id, vendor_id, order_id, amount, currency, payment_date, method, reference, notes,
      entry_type, reverses_payment_id, created_at, vendor:profiles!vendor_payments_vendor_id_fkey(display_name), orders(reference)`)
      .order("created_at", { ascending: false }),
    supabase.from("payment_transactions").select("id, order_id, transaction_type, amount, currency, status, provider_request_id, provider_payment_id, created_at, orders(reference)")
      .order("created_at", { ascending: false }).limit(100),
    supabase.from("orders").select("id, reference, customer_name, total_amount, payment_status, fulfilment_status")
      .eq("payment_provider", "hitpay").in("payment_status", ["paid", "partially_refunded"]).order("created_at", { ascending: false }),
    supabase.from("payment_transactions").select("order_id, amount, status")
      .eq("transaction_type", "refund").in("status", ["pending", "reconciliation_required", "succeeded"]),
  ]);

  const paidByOrder = new Map<string, number>();
  for (const payment of paymentData ?? []) if (payment.order_id) paidByOrder.set(payment.order_id, (paidByOrder.get(payment.order_id) ?? 0) + payment.amount);
  const settlements: SettlementOrder[] = (orderData ?? []).flatMap((order) => {
    const vendor = order.assigned_vendor as unknown as { id: string; display_name: string } | null;
    if (!vendor) return [];
    const paid = paidByOrder.get(order.id) ?? 0;
    return [{ ...order, assigned_vendor: vendor, paid_amount: paid, outstanding_amount: Math.max(0, order.vendor_payout_amount - paid) } as SettlementOrder];
  });
  const reversedIds = new Set((paymentData ?? []).map((payment) => payment.reverses_payment_id).filter(Boolean));
  const vendorLedger: VendorLedgerRow[] = (paymentData ?? []).map((payment) => ({
    id: payment.id, order_id: payment.order_id, amount: payment.amount, currency: payment.currency,
    payment_date: payment.payment_date, method: payment.method, reference: payment.reference, notes: payment.notes,
    entry_type: payment.entry_type as VendorLedgerRow["entry_type"], created_at: payment.created_at,
    vendor_name: (payment.vendor as unknown as { display_name?: string } | null)?.display_name ?? "Unknown vendor",
    order_reference: (payment.orders as unknown as { reference?: string } | null)?.reference ?? null,
    reversed: reversedIds.has(payment.id),
  }));
  const providerTransactions: ProviderTransactionRow[] = (transactionData ?? []).map((transaction) => ({
    ...transaction,
    transaction_type: transaction.transaction_type as ProviderTransactionRow["transaction_type"],
    order_reference: (transaction.orders as unknown as { reference?: string } | null)?.reference ?? "Unknown job",
  }));
  const refundedByOrder = new Map<string, number>();
  const pendingRefunds = new Set<string>();
  for (const refund of refundData ?? []) {
    if (refund.status === "succeeded") refundedByOrder.set(refund.order_id, (refundedByOrder.get(refund.order_id) ?? 0) + refund.amount);
    else pendingRefunds.add(refund.order_id);
  }
  const refundableOrders: RefundableOrder[] = (refundableData ?? []).flatMap((order) => {
    const refundableAmount = order.total_amount - (refundedByOrder.get(order.id) ?? 0);
    if (refundableAmount <= 0) return [];
    return [{
      id: order.id,
      reference: order.reference,
      customer_name: order.customer_name,
      refundable_amount: refundableAmount,
      fulfilment_started: !["not_ready", "ready", "cancelled"].includes(order.fulfilment_status),
      refund_pending: pendingRefunds.has(order.id),
    }];
  });

  const outstanding = settlements.reduce((sum, order) => sum + order.outstanding_amount, 0);
  const refunds = providerTransactions.filter((transaction) => transaction.transaction_type === "refund" && transaction.status === "succeeded").reduce((sum, transaction) => sum + transaction.amount, 0);
  const financeError = orderError || paymentError || transactionError || refundableError || refundError;

  return (
    <>
      <div className="vendor-page-head"><div><p className="vendor-eyebrow">Finance</p><h1 className="display vendor-page-title">Payments and settlement</h1><p className="vendor-page-lead">Provider-confirmed customer money and an append-only SGD partner ledger stay separate from fulfilment.</p></div></div>
      {financeError && <p className="auth-error">Some finance records could not be loaded. Settlement controls are disabled until the record is complete. {financeError.message}</p>}
      <section className="admin-finance-overview" aria-label="Finance summary">
        <div className="admin-finance-exposure"><span>Settlement exposure</span><strong className="display">{formatCents(outstanding)}</strong><p>Owed across verified work</p></div>
        <dl className="admin-finance-summary">
          <div><dt>Open settlements</dt><dd>{settlements.length}</dd><small>Needs action</small></div>
          <div><dt>Ledger entries</dt><dd>{vendorLedger.length}</dd><small>Append-only</small></div>
          <div><dt>Confirmed refunds</dt><dd>{formatCents(refunds)}</dd><small>HitPay confirmed</small></div>
        </dl>
      </section>
      {!financeError && <FinanceReal settlements={settlements} vendorLedger={vendorLedger} providerTransactions={providerTransactions} refundableOrders={refundableOrders} />}
    </>
  );
}
