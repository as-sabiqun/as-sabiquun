export type OrderStatus =
  | "submitted" | "broadcasting" | "assigned" | "in_progress"
  | "proof_submitted" | "revision_required" | "completed" | "expired_unclaimed" | "cancelled";

export interface OrderRow {
  id: string;
  reference: string;
  service_type: "korban" | "wakaf";
  category_slug: string;
  quantity: number;
  participant_names: string[];
  dedication: string | null;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  offerings?: { title: string } | null;
}

export const orderSteps = [
  { key: "received", label: "Order received", statuses: ["submitted", "broadcasting"] as OrderStatus[] },
  { key: "assigned", label: "Assigned to a partner", statuses: ["assigned"] as OrderStatus[] },
  { key: "in_progress", label: "In progress", statuses: ["in_progress", "proof_submitted", "revision_required"] as OrderStatus[] },
  { key: "completed", label: "Completed", statuses: ["completed"] as OrderStatus[] },
];

export function currentStepIndex(status: OrderStatus): number {
  const idx = orderSteps.findIndex((step) => step.statuses.includes(status));
  return idx === -1 ? 0 : idx;
}

export const orderStatusCopy: Record<OrderStatus, string> = {
  submitted: "Order received",
  broadcasting: "Finding a fulfilment partner",
  assigned: "Assigned to a partner",
  in_progress: "In progress",
  proof_submitted: "Evidence under review",
  revision_required: "In progress",
  completed: "Completed",
  expired_unclaimed: "Still finding a partner",
  cancelled: "Cancelled",
};

export function formatCents(cents: number): string {
  return `S$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: cents % 100 === 0 ? 0 : 2 })}`;
}

export function orderTitle(order: OrderRow): string {
  if (order.offerings?.title) return order.offerings.title;
  return order.service_type === "korban" ? "Korban order" : "Wakaf contribution";
}
