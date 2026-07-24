import type { OrderStatus } from "@/lib/orders";

export const adminFilters: { label: string; statuses: OrderStatus[] | null }[] = [
  { label: "All", statuses: null },
  { label: "Needs broadcast", statuses: ["submitted"] },
  { label: "Awaiting claim", statuses: ["broadcasting"] },
  { label: "In progress", statuses: ["assigned", "in_progress", "proof_submitted"] },
  { label: "Completed", statuses: ["completed"] },
  { label: "Unclaimed", statuses: ["expired_unclaimed"] },
];

export const adminOrderStatusLabel: Record<OrderStatus, string> = {
  submitted: "Needs broadcast",
  broadcasting: "Awaiting claim",
  assigned: "Assigned",
  in_progress: "In progress",
  proof_submitted: "Proof submitted",
  completed: "Completed",
  expired_unclaimed: "Unclaimed — expired",
  cancelled: "Cancelled",
};

export function adminStatusPillVariant(status: OrderStatus): string {
  if (status === "completed") return "completed";
  if (status === "submitted" || status === "broadcasting") return "pending";
  if (status === "expired_unclaimed" || status === "cancelled") return "rejected";
  return "accepted";
}
