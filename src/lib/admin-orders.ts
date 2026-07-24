import type { OrderStatus } from "@/lib/orders";

export const adminFilters: { label: string; statuses: OrderStatus[] | null }[] = [
  { label: "All", statuses: null },
  { label: "Needs broadcast", statuses: ["submitted"] },
  { label: "Awaiting claim", statuses: ["broadcasting"] },
  { label: "In progress", statuses: ["assigned", "in_progress"] },
  { label: "Needs review", statuses: ["proof_submitted"] },
  { label: "Revision requested", statuses: ["revision_required"] },
  { label: "Completed", statuses: ["completed"] },
  { label: "Unclaimed", statuses: ["expired_unclaimed"] },
];

export const adminOrderStatusLabel: Record<OrderStatus, string> = {
  submitted: "Needs broadcast",
  broadcasting: "Awaiting claim",
  assigned: "Assigned",
  in_progress: "In progress",
  proof_submitted: "Needs review",
  revision_required: "Revision requested",
  completed: "Completed",
  expired_unclaimed: "Unclaimed — expired",
  cancelled: "Cancelled",
};

export function adminStatusPillVariant(status: OrderStatus): string {
  if (status === "completed") return "completed";
  if (status === "submitted" || status === "broadcasting" || status === "proof_submitted") return "pending";
  if (status === "expired_unclaimed" || status === "cancelled" || status === "revision_required") return "rejected";
  return "accepted";
}
