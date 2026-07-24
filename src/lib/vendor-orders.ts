import type { OrderStatus } from "@/lib/orders";

export const vendorOrderStatusLabel: Record<OrderStatus, string> = {
  submitted: "Not yet offered",
  broadcasting: "Awaiting response",
  assigned: "Accepted",
  in_progress: "In progress",
  proof_submitted: "Submitted — under review",
  revision_required: "Changes requested — resubmit",
  completed: "Completed",
  expired_unclaimed: "Expired",
  cancelled: "Cancelled",
};

export function vendorStatusPillVariant(status: OrderStatus): string {
  if (status === "completed" || status === "proof_submitted") return "completed";
  if (status === "assigned" || status === "in_progress") return "accepted";
  if (status === "broadcasting") return "pending";
  if (status === "revision_required") return "rejected";
  return "rejected";
}

export function formatOfferCountdown(expiresAt: string): { label: string; urgent: boolean; expired: boolean } {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return { label: "Response window closed", urgent: false, expired: true };
  const hrs = Math.floor(diffMs / (60 * 60 * 1000));
  const mins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  const label = hrs > 0 ? `${hrs}h ${mins}m left to respond` : `${mins}m left to respond`;
  return { label, urgent: diffMs < 60 * 60 * 1000, expired: false };
}
