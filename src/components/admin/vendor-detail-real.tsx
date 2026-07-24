"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { adminOrderStatusLabel, adminStatusPillVariant } from "@/lib/admin-orders";
import { formatCents, orderTitle, type OrderRow } from "@/lib/orders";
import { vendorServiceOptions } from "@/lib/admin-demo";
import { suspendVendorAction, recordVendorPaymentAction } from "@/app/admin/actions";

export interface VendorDetail {
  id: string;
  display_name: string;
  email: string;
  contact_person: string | null;
  phone: string | null;
  whatsapp: string | null;
  country: string | null;
  city_address: string | null;
  vendor_type: string | null;
  services: string[];
  status: "active" | "suspended";
  currency: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  swift_code: string | null;
  rating: number | null;
  notes: string | null;
  created_at: string;
}

export interface VendorPaymentRow {
  id: string;
  amount: number;
  payment_date: string;
  method: string | null;
  reference: string | null;
  order_reference: string | null;
}

export function VendorDetailReal({
  vendor,
  orders,
  payments,
  totalPayable,
}: {
  vendor: VendorDetail;
  orders: OrderRow[];
  payments: VendorPaymentRow[];
  totalPayable: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [paymentPending, startPaymentTransition] = useTransition();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [orderId, setOrderId] = useState("");
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const completed = orders.filter((o) => o.status === "completed").length;
  const active = orders.filter((o) => ["assigned", "in_progress", "proof_submitted"].includes(o.status)).length;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = totalPayable - totalPaid;

  function toggleStatus() {
    startTransition(async () => {
      await suspendVendorAction(vendor.id, vendor.status === "active" ? "suspended" : "active");
      router.refresh();
    });
  }

  function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountCents = Math.round(Number(amount) * 100);
    if (!amountCents || amountCents <= 0) {
      setPaymentError("Enter a valid amount.");
      return;
    }
    setPaymentError(null);
    startPaymentTransition(async () => {
      const res = await recordVendorPaymentAction({
        vendorId: vendor.id,
        orderId: orderId || null,
        amountCents,
        paymentDate: new Date().toISOString().slice(0, 10),
        method,
        reference,
        notes,
      });
      if (!res.ok) {
        setPaymentError(res.error ?? "Couldn't record this payment.");
        return;
      }
      setAmount("");
      setMethod("");
      setReference("");
      setNotes("");
      setShowPaymentForm(false);
      router.refresh();
    });
  }

  return (
    <>
      <nav className="breadcrumb">
        <Link href="/admin/vendors">Vendors</Link>
        <span aria-hidden="true">/</span>
        <span>{vendor.display_name}</span>
      </nav>

      <div className="vendor-detail-layout mt-6">
        <div className="card vendor-panel">
          <div className="vendor-detail-head">
            <div>
              <h1 className="display vendor-page-title">{vendor.display_name}</h1>
              <p className="vendor-page-lead">{vendor.vendor_type ?? "—"} · Vendor since {new Date(vendor.created_at).toLocaleDateString()}</p>
            </div>
            <span className={`vendor-status ${vendor.status === "active" ? "vendor-status-accepted" : "vendor-status-rejected"}`}>
              {vendor.status === "active" ? "Active" : "Suspended"}
            </span>
          </div>

          <div className="vendor-stat-grid admin-vendor-stats">
            <div className="admin-inline-stat"><span>Jobs completed</span><strong className="numeral">{completed}</strong></div>
            <div className="admin-inline-stat"><span>Active jobs</span><strong className="numeral">{active}</strong></div>
            <div className="admin-inline-stat"><span>Rating</span><strong className="numeral">{vendor.rating ? vendor.rating.toFixed(1) : "—"}</strong></div>
          </div>

          {vendor.notes && (
            <div className="mt-6">
              <span className="label mb-2 block">Internal notes</span>
              <p className="text-sm text-[var(--muted)]">{vendor.notes}</p>
            </div>
          )}

          <div className="mt-8">
            <span className="label mb-3 block">Job history</span>
            {orders.length === 0 ? (
              <p className="vendor-empty">No jobs assigned yet.</p>
            ) : (
              <div className="vendor-job-list">
                {orders.map((order) => (
                  <Link key={order.id} href={`/admin/jobs/${order.id}`} className="vendor-job-row">
                    <div>
                      <strong>{orderTitle(order)}</strong>
                      <small>{order.reference}</small>
                    </div>
                    <div className="vendor-job-row-meta">
                      <span className={`vendor-status vendor-status-${adminStatusPillVariant(order.status)}`}>
                        {adminOrderStatusLabel[order.status]}
                      </span>
                      <strong className="numeral">{formatCents(order.total_amount)}</strong>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <div className="vendor-panel-head">
              <span className="label">Payment ledger</span>
              <button type="button" className="btn-secondary btn btn-small" onClick={() => setShowPaymentForm((v) => !v)}>
                {showPaymentForm ? "Cancel" : "Record payment"}
              </button>
            </div>

            <div className="vendor-stat-grid admin-vendor-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div className="admin-inline-stat"><span>Payable</span><strong className="numeral">{formatCents(totalPayable)}</strong></div>
              <div className="admin-inline-stat"><span>Paid</span><strong className="numeral">{formatCents(totalPaid)}</strong></div>
              <div className="admin-inline-stat"><span>Outstanding</span><strong className="numeral" style={outstanding > 0 ? { color: "#b3402f" } : undefined}>{formatCents(outstanding)}</strong></div>
            </div>

            {showPaymentForm && (
              <form className="grid gap-4 mt-5" onSubmit={submitPayment}>
                {paymentError && <p className="auth-error">{paymentError}</p>}
                <div className="admin-form-grid">
                  <label className="label">Amount ({vendor.currency ?? "SGD"})
                    <input className="input" type="number" step="0.01" min="0" required value={amount} onChange={(event) => setAmount(event.target.value)} />
                  </label>
                  <label className="label">Related job <span className="font-normal text-[var(--muted)]">Optional</span>
                    <select className="input" value={orderId} onChange={(event) => setOrderId(event.target.value)}>
                      <option value="">Not job-specific</option>
                      {orders.map((o) => <option key={o.id} value={o.id}>{o.reference} — {orderTitle(o)}</option>)}
                    </select>
                  </label>
                </div>
                <div className="admin-form-grid">
                  <label className="label">Method <span className="font-normal text-[var(--muted)]">Optional</span>
                    <input className="input" placeholder="e.g. Bank transfer" value={method} onChange={(event) => setMethod(event.target.value)} />
                  </label>
                  <label className="label">Reference <span className="font-normal text-[var(--muted)]">Optional</span>
                    <input className="input" placeholder="Transaction reference" value={reference} onChange={(event) => setReference(event.target.value)} />
                  </label>
                </div>
                <label className="label">Notes <span className="font-normal text-[var(--muted)]">Optional</span>
                  <textarea className="input vendor-textarea" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
                </label>
                <button type="submit" className="btn" disabled={paymentPending}>{paymentPending ? "Recording…" : "Record payment"}</button>
              </form>
            )}

            {payments.length > 0 && (
              <div className="vendor-job-list mt-5">
                {payments.map((p) => (
                  <div key={p.id} className="vendor-job-row">
                    <div>
                      <strong>{formatCents(p.amount)}</strong>
                      <small>{p.order_reference ?? "Not job-specific"} · {new Date(p.payment_date).toLocaleDateString()}{p.method ? ` · ${p.method}` : ""}</small>
                    </div>
                    {p.reference && <span className="text-xs text-[var(--muted)]">{p.reference}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card vendor-panel">
          <span className="vendor-eyebrow">Contact details</span>
          <dl className="admin-contact-facts mt-3">
            {vendor.contact_person && <div><dt>Contact</dt><dd>{vendor.contact_person}</dd></div>}
            <div><dt>Email</dt><dd>{vendor.email}</dd></div>
            <div><dt>Phone</dt><dd>{vendor.phone || "—"}</dd></div>
            {vendor.whatsapp && <div><dt>WhatsApp</dt><dd>{vendor.whatsapp}</dd></div>}
            {vendor.country && <div><dt>Country</dt><dd>{vendor.country}</dd></div>}
            {vendor.city_address && <div><dt>Address</dt><dd>{vendor.city_address}</dd></div>}
            <div><dt>Vendor ID</dt><dd>{vendor.id}</dd></div>
          </dl>

          <span className="vendor-eyebrow mt-6 block">Services</span>
          <div className="admin-checkbox-group mt-3">
            {vendorServiceOptions.map((option) => (
              <span key={option.slug} className={`admin-checkbox-pill is-static ${vendor.services.includes(option.slug) ? "is-active" : ""}`}>
                {option.title}
              </span>
            ))}
          </div>

          {(vendor.bank_name || vendor.bank_account_number) && (
            <>
              <span className="vendor-eyebrow mt-6 block">Payment details</span>
              <dl className="admin-contact-facts mt-3">
                <div><dt>Currency</dt><dd>{vendor.currency ?? "SGD"}</dd></div>
                {vendor.bank_name && <div><dt>Bank</dt><dd>{vendor.bank_name}</dd></div>}
                {vendor.bank_account_name && <div><dt>Account name</dt><dd>{vendor.bank_account_name}</dd></div>}
                {vendor.bank_account_number && <div><dt>Account no.</dt><dd>{vendor.bank_account_number}</dd></div>}
                {vendor.swift_code && <div><dt>SWIFT</dt><dd>{vendor.swift_code}</dd></div>}
              </dl>
            </>
          )}

          <button type="button" className="btn-secondary btn mt-6" disabled={pending} onClick={toggleStatus}>
            {pending ? "Updating…" : vendor.status === "active" ? "Suspend vendor" : "Reactivate vendor"}
          </button>
        </div>
      </div>
    </>
  );
}
