export const paymentStatuses = [
  "pending",
  "paid",
  "partially_refunded",
  "refunded",
  "failed",
  "expired",
  "cancelled",
] as const;

export const fulfilmentStatuses = [
  "not_ready",
  "ready",
  "broadcasting",
  "assigned",
  "in_progress",
  "proof_submitted",
  "revision_required",
  "verified",
  "cancelled",
] as const;

export const deliveryStatuses = ["not_ready", "queued", "partial", "delivered", "failed"] as const;
export const settlementStatuses = ["unpaid", "partially_paid", "paid"] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];
export type FulfilmentStatus = (typeof fulfilmentStatuses)[number];
export type DeliveryStatus = (typeof deliveryStatuses)[number];
export type SettlementStatus = (typeof settlementStatuses)[number];
export type OrderMilestone =
  | "awaiting_payment"
  | "payment_issue"
  | "ready"
  | "broadcasting"
  | "assigned"
  | "in_progress"
  | "under_review"
  | "revision_required"
  | "verified"
  | "delivery_failed"
  | "completed"
  | "closed"
  | "cancelled"
  | "refunded";

export interface LifecycleAxes {
  payment_status: PaymentStatus;
  fulfilment_status: FulfilmentStatus;
  delivery_status: DeliveryStatus;
  settlement_status: SettlementStatus;
}

export function deriveOrderMilestone(axes: LifecycleAxes): OrderMilestone {
  if (axes.payment_status === "refunded") return "refunded";
  if (axes.fulfilment_status === "cancelled") return "cancelled";
  if (["failed", "expired", "cancelled"].includes(axes.payment_status)) return "payment_issue";
  if (axes.payment_status === "pending") return "awaiting_payment";
  if (axes.fulfilment_status === "verified" && axes.delivery_status === "delivered" && axes.settlement_status === "paid") return "closed";
  if (axes.fulfilment_status === "verified" && axes.delivery_status === "delivered") return "completed";
  if (axes.fulfilment_status === "verified" && axes.delivery_status === "failed") return "delivery_failed";
  if (axes.fulfilment_status === "verified") return "verified";
  if (axes.fulfilment_status === "revision_required") return "revision_required";
  if (axes.fulfilment_status === "proof_submitted") return "under_review";
  if (axes.fulfilment_status === "in_progress") return "in_progress";
  if (axes.fulfilment_status === "assigned") return "assigned";
  if (axes.fulfilment_status === "broadcasting") return "broadcasting";
  return "ready";
}

export const milestoneLabels: Record<OrderMilestone, string> = {
  awaiting_payment: "Awaiting payment",
  payment_issue: "Payment needs attention",
  ready: "Received",
  broadcasting: "Finding a fulfilment partner",
  assigned: "Partner assigned",
  in_progress: "In fulfilment",
  under_review: "Evidence under review",
  revision_required: "Revision in progress",
  verified: "Verified — preparing your report",
  delivery_failed: "Report delivery needs attention",
  completed: "Completed",
  closed: "Closed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function isPaid(status: PaymentStatus) {
  return status === "paid" || status === "partially_refunded";
}
