import type { DeliveryStatus, FulfilmentStatus, PaymentStatus, SettlementStatus } from "@/lib/order-lifecycle";

export type AdminQueueKey =
  | "payment_issue"
  | "ready"
  | "unclaimed"
  | "fulfilment"
  | "review"
  | "delivery_failed"
  | "settlement";

export interface QueueableOrder {
  payment_status: PaymentStatus;
  fulfilment_status: FulfilmentStatus;
  delivery_status: DeliveryStatus;
  settlement_status: SettlementStatus;
  broadcast_started_at: string | null;
  broadcast_expires_at: string | null;
  refund_fulfilment_resolution?: "cancelled_work" | "retained_verified" | null;
}

export const queueMeta: Record<AdminQueueKey, { label: string; help: string }> = {
  payment_issue: { label: "Payment issue", help: "Payment failed or expired" },
  ready: { label: "Ready to broadcast", help: "Paid and ready for a partner" },
  unclaimed: { label: "Unclaimed", help: "Offer window expired without a claim" },
  fulfilment: { label: "In fulfilment", help: "Offered, assigned, or being revised" },
  review: { label: "Evidence review", help: "A submission is waiting for verification" },
  delivery_failed: { label: "Delivery failed", help: "Email or Telegram needs intervention" },
  settlement: { label: "Settlement outstanding", help: "Customer delivery is complete; vendor payment is due" },
};

export function queueForOrder(order: QueueableOrder, now = Date.now()): AdminQueueKey | null {
  if (order.payment_status === "failed" || order.payment_status === "expired") return "payment_issue";
  if (["refunded", "cancelled"].includes(order.payment_status) && !["not_ready", "cancelled"].includes(order.fulfilment_status) && !order.refund_fulfilment_resolution) return "payment_issue";
  if (order.fulfilment_status === "proof_submitted") return "review";
  if (order.fulfilment_status === "verified" && order.delivery_status === "failed") return "delivery_failed";
  if (order.fulfilment_status === "verified" && order.delivery_status === "delivered" && order.settlement_status !== "paid") return "settlement";
  if (order.refund_fulfilment_resolution === "retained_verified" && order.settlement_status !== "paid") return "settlement";
  if (order.fulfilment_status === "ready") return order.broadcast_started_at ? "unclaimed" : "ready";
  if (order.fulfilment_status === "broadcasting" && order.broadcast_expires_at && new Date(order.broadcast_expires_at).getTime() <= now) return "unclaimed";
  if (["broadcasting", "assigned", "in_progress", "revision_required"].includes(order.fulfilment_status)) return "fulfilment";
  return null;
}
