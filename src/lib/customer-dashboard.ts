import type { OrderStatus } from "@/lib/orders";

export type CustomerBoardKey = "waiting" | "active" | "review" | "completed";

export const customerBoardColumns: ReadonlyArray<{
  key: CustomerBoardKey;
  label: string;
  description: string;
  statuses: readonly OrderStatus[];
}> = [
  {
    key: "waiting",
    label: "Received",
    description: "We are preparing your service",
    statuses: ["submitted", "broadcasting", "expired_unclaimed"],
  },
  {
    key: "active",
    label: "In fulfilment",
    description: "A partner is carrying it out",
    statuses: ["assigned", "in_progress", "revision_required"],
  },
  {
    key: "review",
    label: "Being verified",
    description: "Evidence and reports are checked",
    statuses: ["proof_submitted", "verified"],
  },
  {
    key: "completed",
    label: "Completed",
    description: "Delivered to you",
    statuses: ["completed", "closed"],
  },
];

export interface JourneyOrder {
  created_at: string;
  admin_verified_at?: string | null;
  status: OrderStatus;
}

export interface JourneyPoint {
  label: string;
  started: number;
  verified: number;
}

export function buildJourneySeries(orders: JourneyOrder[], now = new Date(), monthCount = 8): JourneyPoint[] {
  const endMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startMonth = new Date(Date.UTC(endMonth.getUTCFullYear(), endMonth.getUTCMonth() - (monthCount - 1), 1));
  const validOrders = orders.filter((order) => order.status !== "cancelled");
  let startedTotal = validOrders.filter((order) => new Date(order.created_at) < startMonth).length;
  let verifiedTotal = validOrders.filter((order) => order.admin_verified_at && new Date(order.admin_verified_at) < startMonth).length;

  return Array.from({ length: monthCount }, (_, index) => {
    const month = new Date(Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() + index, 1));
    const nextMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));
    startedTotal += validOrders.filter((order) => {
      const createdAt = new Date(order.created_at);
      return createdAt >= month && createdAt < nextMonth;
    }).length;
    verifiedTotal += validOrders.filter((order) => {
      if (!order.admin_verified_at) return false;
      const verifiedAt = new Date(order.admin_verified_at);
      return verifiedAt >= month && verifiedAt < nextMonth;
    }).length;

    return {
      label: new Intl.DateTimeFormat("en-SG", { month: "short", timeZone: "UTC" }).format(month),
      started: startedTotal,
      verified: verifiedTotal,
    };
  });
}

export function boardKeyForStatus(status: OrderStatus): CustomerBoardKey | null {
  return customerBoardColumns.find((column) => column.statuses.includes(status))?.key ?? null;
}
