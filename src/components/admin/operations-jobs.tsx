import Link from "next/link";
import {
  deriveOrderMilestone,
  milestoneLabels,
  type DeliveryStatus,
  type FulfilmentStatus,
  type PaymentStatus,
  type SettlementStatus,
  type LifecycleAxes,
} from "@/lib/order-lifecycle";
import { formatCents, orderTitle, type OrderRow } from "@/lib/orders";
import { queueForOrder } from "@/app/admin/operations";

export interface AdminLifecycleOrder extends OrderRow {
  payment_status: PaymentStatus;
  fulfilment_status: FulfilmentStatus;
  delivery_status: DeliveryStatus;
  settlement_status: SettlementStatus;
  customer_name: string;
  customer_email: string | null;
  assigned_vendor: { id: string; display_name: string } | null;
  broadcast_started_at: string | null;
  broadcast_expires_at: string | null;
  refund_fulfilment_resolution: "cancelled_work" | "retained_verified" | null;
  vendor_payout_amount: number;
  updated_at: string;
}

export function lifecyclePillVariant(axes: LifecycleAxes) {
  const milestone = deriveOrderMilestone(axes);
  if (["closed", "completed"].includes(milestone)) return "completed";
  if (["payment_issue", "delivery_failed", "revision_required", "cancelled", "refunded"].includes(milestone)) return "rejected";
  if (["awaiting_payment", "broadcasting", "under_review", "verified"].includes(milestone)) return "pending";
  return "accepted";
}

export function lifecycleLabel(axes: LifecycleAxes) {
  return milestoneLabels[deriveOrderMilestone(axes)];
}

export function orderLifecycleLabel(order: AdminLifecycleOrder) {
  if (queueForOrder(order) === "unclaimed") return "Needs vendor";
  return lifecycleLabel(order);
}

export function AdminJobsTable({ orders, empty = "No jobs match this view." }: { orders: AdminLifecycleOrder[]; empty?: string }) {
  if (orders.length === 0) return <div className="card vendor-panel"><p className="vendor-empty">{empty}</p></div>;

  return (
    <div className="card vendor-job-table">
      {orders.map((order) => (
        <div key={order.id} className="vendor-job-table-row">
          <Link href={`/admin/jobs/${order.id}`} className="vendor-job-table-main">
            <span className="vendor-job-table-category">{order.service_type}</span>
            <strong>{orderTitle(order)}</strong>
            <small>{order.reference} · {order.customer_name}{order.assigned_vendor ? ` · ${order.assigned_vendor.display_name}` : ""}</small>
          </Link>
          <div className="vendor-job-table-price"><strong className="numeral">{formatCents(order.total_amount)}</strong></div>
          <div className="vendor-job-table-status">
            <span className={`vendor-status vendor-status-${lifecyclePillVariant(order)}`}>{orderLifecycleLabel(order)}</span>
            <span className="vendor-countdown">{new Date(order.updated_at).toLocaleDateString()}</span>
          </div>
          <Link href={`/admin/jobs/${order.id}`} className="vendor-job-table-view">Open <span aria-hidden="true">→</span></Link>
        </div>
      ))}
    </div>
  );
}
