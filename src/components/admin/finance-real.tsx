"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { recordVendorPaymentAction, reverseVendorPaymentAction } from "@/app/admin/actions";
import { formatCents } from "@/lib/orders";

export interface SettlementOrder {
  id: string;
  reference: string;
  customer_name: string;
  vendor_payout_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  settlement_status: "unpaid" | "partially_paid" | "paid";
  assigned_vendor: { id: string; display_name: string };
}

export interface VendorLedgerRow {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  payment_date: string;
  method: string | null;
  reference: string | null;
  notes: string | null;
  entry_type: "payment" | "reversal" | "adjustment";
  created_at: string;
  vendor_name: string;
  order_reference: string | null;
  reversed: boolean;
}

export interface ProviderTransactionRow {
  id: string;
  transaction_type: "payment" | "refund";
  amount: number;
  currency: string;
  status: string;
  provider_request_id: string;
  provider_payment_id: string | null;
  created_at: string;
  order_reference: string;
}

export interface RefundableOrder {
  id: string;
  reference: string;
  customer_name: string;
  refundable_amount: number;
  fulfilment_started: boolean;
  refund_pending: boolean;
}

export function FinanceReal({ settlements, vendorLedger, providerTransactions, refundableOrders }: {
  settlements: SettlementOrder[];
  vendorLedger: VendorLedgerRow[];
  providerTransactions: ProviderTransactionRow[];
  refundableOrders: RefundableOrder[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [paying, setPaying] = useState<string | null>(null);
  const [reversing, setReversing] = useState<string | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [reconciling, setReconciling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function recordPayment(event: FormEvent<HTMLFormElement>, order: SettlementOrder) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amountCents = Math.round(Number(form.get("amount")) * 100);
    setError(null);
    startTransition(async () => {
      const result = await recordVendorPaymentAction({
        vendorId: order.assigned_vendor.id,
        orderId: order.id,
        amountCents,
        paymentDate: String(form.get("date")),
        method: String(form.get("method") ?? ""),
        reference: String(form.get("reference") ?? ""),
        notes: String(form.get("notes") ?? ""),
      });
      if (!result.ok) setError(result.error ?? "The settlement could not be recorded.");
      else { setPaying(null); router.refresh(); }
    });
  }

  function reversePayment(event: FormEvent<HTMLFormElement>, paymentId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await reverseVendorPaymentAction({
        paymentId,
        reference: String(form.get("reference") ?? ""),
        notes: String(form.get("notes") ?? ""),
      });
      if (!result.ok) setError(result.error ?? "The reversal could not be recorded.");
      else { setReversing(null); router.refresh(); }
    });
  }

  function refundCustomer(event: FormEvent<HTMLFormElement>, order: RefundableOrder) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const response = await fetch("/api/payments/hitpay/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          amount: String(form.get("amount") ?? ""),
          reason: String(form.get("reason") ?? ""),
          confirmFulfilmentStarted: form.get("confirmFulfilmentStarted") === "on",
        }),
      });
      const result = await response.json().catch(() => null) as { error?: string; message?: string } | null;
      if (!response.ok) setError(result?.error ?? "The refund could not be started.");
      else {
        setRefunding(null);
        setNotice(result?.message ?? "The refund is pending HitPay confirmation.");
        router.refresh();
      }
    });
  }

  function reconcileProviderTransaction(transaction: ProviderTransactionRow) {
    setError(null);
    setNotice(null);
    setReconciling(transaction.id);
    startTransition(async () => {
      const endpoint = transaction.transaction_type === "refund"
        ? "/api/payments/hitpay/reconcile-refund"
        : "/api/payments/hitpay/reconcile-payment";
      let response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: transaction.id }),
      });
      let result = await response.json().catch(() => null) as { error?: string; message?: string; canRelease?: boolean } | null;
      if (response.ok && result?.canRelease && window.confirm(`${result.message ?? "No live provider result was found."}\n\nRelease this attempt and allow a new request?`)) {
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId: transaction.id,
            ...(transaction.transaction_type === "refund" ? { releaseIfUnchanged: true } : { releaseIfMissing: true }),
          }),
        });
        result = await response.json().catch(() => null) as { error?: string; message?: string } | null;
      }
      if (!response.ok) setError(result?.error ?? "The HitPay transaction could not be reconciled.");
      else setNotice(result?.message ?? "HitPay reconciliation completed.");
      setReconciling(null);
      router.refresh();
    });
  }

  return (
    <>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="vendor-empty" role="status">{notice}</p>}

      <nav className="admin-finance-index" aria-label="Finance sections">
        <a href="#settlements"><span>{settlements.length}</span>Vendor payouts</a>
        <a href="#refunds"><span>{refundableOrders.length}</span>Refunds</a>
        <a href="#vendor-ledger"><span>{vendorLedger.length}</span>Vendor payments</a>
        <a href="#hitpay-ledger"><span>{providerTransactions.length}</span>Customer payments</a>
      </nav>

      <div className="admin-finance-layout">
      <section id="settlements" className="card vendor-panel admin-finance-panel admin-finance-settlements">
        <div className="vendor-panel-head"><div><p className="vendor-eyebrow">Vendor payments</p><h2 className="display text-lg mt-1">Payments still due</h2></div><span className="vendor-status vendor-status-pending">{settlements.length} open</span></div>
        {settlements.length === 0 ? <p className="vendor-empty">Every approved job has been paid in full.</p> : (
          <div className="vendor-report-list">
            {settlements.map((order) => (
              <article key={order.id} className="vendor-report-item">
                <div className="vendor-report-item-head">
                  <div><Link href={`/admin/jobs/${order.id}`}><strong>{order.reference}</strong></Link><small>{order.assigned_vendor.display_name} · {order.customer_name}</small></div>
                  <div className="text-right"><strong className="numeral">{formatCents(order.outstanding_amount)}</strong><small>of {formatCents(order.vendor_payout_amount)}</small></div>
                </div>
                {paying === order.id ? (
                  <form className="grid gap-4 mt-4" onSubmit={(event) => recordPayment(event, order)}>
                    <div className="admin-form-grid">
                      <label className="label">Amount (SGD)<input className="input" name="amount" type="number" min="0.01" max={(order.outstanding_amount / 100).toFixed(2)} step="0.01" defaultValue={(order.outstanding_amount / 100).toFixed(2)} required /></label>
                      <label className="label">Payment date<input className="input" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
                      <label className="label">Method<input className="input" name="method" placeholder="Bank transfer" /></label>
                      <label className="label">Unique reference<input className="input" name="reference" required maxLength={200} placeholder="Bank transaction reference" /></label>
                    </div>
                    <label className="label">Notes<textarea className="input vendor-textarea" name="notes" rows={2} maxLength={2000} /></label>
                    <div className="flex gap-3"><button className="btn btn-small" disabled={pending}>Record payment</button><button className="btn btn-secondary btn-small" type="button" onClick={() => setPaying(null)}>Cancel</button></div>
                  </form>
                ) : <button className="btn btn-secondary btn-small mt-4" type="button" onClick={() => setPaying(order.id)}>Record payment</button>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="vendor-ledger" className="card vendor-panel admin-finance-panel admin-finance-vendor-ledger">
        <div className="vendor-panel-head"><div><p className="vendor-eyebrow">Payment history</p><h2 className="display text-lg mt-1">Vendor payments</h2></div></div>
        {vendorLedger.length === 0 ? <p className="vendor-empty">No vendor payments recorded.</p> : (
          <div className="admin-payment-list">
            {vendorLedger.map((payment) => (
              <div key={payment.id}>
                <strong className="numeral">{formatCents(payment.amount)}</strong>
                <span>{payment.vendor_name} · {payment.order_reference || "No job"} · {new Date(payment.payment_date).toLocaleDateString()}<small className="block">{payment.entry_type} · {payment.reference || "No reference"}</small></span>
                {payment.entry_type === "payment" && !payment.reversed && (reversing === payment.id ? (
                  <form className="grid gap-2" onSubmit={(event) => reversePayment(event, payment.id)}>
                    <input className="input" name="reference" required maxLength={200} placeholder="Reversal reference" />
                    <input className="input" name="notes" maxLength={2000} placeholder="Reason" />
                    <div className="flex gap-2"><button className="btn btn-small" disabled={pending}>Confirm</button><button className="btn btn-secondary btn-small" type="button" onClick={() => setReversing(null)}>Cancel</button></div>
                  </form>
                ) : <button className="btn btn-secondary btn-small" type="button" onClick={() => setReversing(payment.id)}>Reverse</button>)}
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="refunds" className="card vendor-panel admin-finance-panel admin-finance-refunds">
        <div className="vendor-panel-head"><div><p className="vendor-eyebrow">Customer refunds</p><h2 className="display text-lg mt-1">Refundable HitPay orders</h2></div></div>
        <p className="admin-record-help mb-4">HitPay accepts the request here; only its signed webhook changes the confirmed customer balance.</p>
        {refundableOrders.length === 0 ? <p className="vendor-empty">No customer payment is currently refundable.</p> : (
          <div className="vendor-report-list">
            {refundableOrders.map((order) => (
              <article key={order.id} className="vendor-report-item">
                <div className="vendor-report-item-head">
                  <div><Link href={`/admin/jobs/${order.id}`}><strong>{order.reference}</strong></Link><small>{order.customer_name}</small></div>
                  <div className="text-right"><strong className="numeral">{formatCents(order.refundable_amount)}</strong><small>maximum refundable</small></div>
                </div>
                {order.refund_pending ? <p className="vendor-empty mt-4">A refund is awaiting HitPay confirmation.</p> : refunding === order.id ? (
                  <form className="grid gap-4 mt-4" onSubmit={(event) => refundCustomer(event, order)}>
                    <label className="label">Amount (SGD)<input className="input" name="amount" type="number" min="0.01" max={(order.refundable_amount / 100).toFixed(2)} step="0.01" defaultValue={(order.refundable_amount / 100).toFixed(2)} required /></label>
                    <label className="label">Refund reason<textarea className="input vendor-textarea" name="reason" rows={3} maxLength={1000} required /></label>
                    {order.fulfilment_started && <label className="flex gap-3 items-start"><input name="confirmFulfilmentStarted" type="checkbox" required /><span><strong>Fulfilment has started.</strong><small className="block">I have reviewed the operational impact and still want to request this refund.</small></span></label>}
                    <div className="flex gap-3"><button className="btn btn-small" disabled={pending}>Request HitPay refund</button><button className="btn btn-secondary btn-small" type="button" onClick={() => setRefunding(null)}>Cancel</button></div>
                  </form>
                ) : <button className="btn btn-secondary btn-small mt-4" type="button" onClick={() => setRefunding(order.id)}>Refund customer</button>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="hitpay-ledger" className="card vendor-panel admin-finance-panel admin-finance-hitpay-ledger">
        <div className="vendor-panel-head"><div><p className="vendor-eyebrow">Payment history</p><h2 className="display text-lg mt-1">Customer payments</h2></div></div>
        <p className="admin-record-help mb-4">Payments and refunds appear here after HitPay confirms them.</p>
        {providerTransactions.length === 0 ? <p className="vendor-empty">No HitPay transactions recorded.</p> : (
          <div className="admin-payment-list">
            {providerTransactions.map((transaction) => <div key={transaction.id}><strong className="numeral">{formatCents(transaction.transaction_type === "refund" ? -transaction.amount : transaction.amount)}</strong><span>{transaction.order_reference} · {transaction.transaction_type}</span><small>{transaction.status} · {new Date(transaction.created_at).toLocaleString()}{["pending", "reconciliation_required"].includes(transaction.status) && <button type="button" className="btn btn-secondary btn-small ml-3" disabled={pending} onClick={() => reconcileProviderTransaction(transaction)}>{reconciling === transaction.id ? "Checking…" : "Check HitPay"}</button>}</small></div>)}
          </div>
        )}
      </section>
      </div>
    </>
  );
}
