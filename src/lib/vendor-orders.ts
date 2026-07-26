import { deriveOrderMilestone, milestoneLabels, type LifecycleAxes, type OrderMilestone } from "@/lib/order-lifecycle";

export function vendorJobMilestone(job: LifecycleAxes): OrderMilestone {
  return deriveOrderMilestone(job);
}

export function vendorOrderStatusLabel(job: LifecycleAxes): string {
  return milestoneLabels[vendorJobMilestone(job)];
}

export function vendorStatusPillVariant(status: OrderMilestone): string {
  if (["verified", "completed", "closed", "under_review"].includes(status)) return "completed";
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
