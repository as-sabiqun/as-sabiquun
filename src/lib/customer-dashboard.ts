import { isPaid, type DeliveryStatus, type FulfilmentStatus, type PaymentStatus } from "./order-lifecycle.ts";

export type CustomerBoardKey = "waiting" | "active" | "review" | "completed";

export const customerBoardColumns: ReadonlyArray<{
  key: CustomerBoardKey;
  label: string;
  description: string;
}> = [
  {
    key: "waiting",
    label: "Received",
    description: "We are preparing your service",
  },
  {
    key: "active",
    label: "Work in progress",
    description: "A vendor is carrying it out",
  },
  {
    key: "review",
    label: "Under review",
    description: "We are checking the submitted work",
  },
  {
    key: "completed",
    label: "Completed",
    description: "Delivered to you",
  },
];

export interface JourneyOrder {
  created_at: string;
  payment_confirmed_at?: string | null;
  admin_verified_at?: string | null;
  payment_status: PaymentStatus;
  fulfilment_status: FulfilmentStatus;
  is_test?: boolean;
}

export interface JourneyPoint {
  label: string;
  started: number;
  verified: number;
}

export function isImpactOrder(order: Pick<JourneyOrder, "payment_status" | "fulfilment_status" | "is_test">) {
  return !order.is_test && order.fulfilment_status !== "cancelled" && isPaid(order.payment_status);
}

export function buildJourneySeries(orders: JourneyOrder[], now = new Date(), monthCount = 8): JourneyPoint[] {
  const endMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startMonth = new Date(Date.UTC(endMonth.getUTCFullYear(), endMonth.getUTCMonth() - (monthCount - 1), 1));
  const validOrders = orders.filter(isImpactOrder);
  let startedTotal = validOrders.filter((order) => new Date(order.payment_confirmed_at ?? order.created_at) < startMonth).length;
  let verifiedTotal = validOrders.filter((order) => order.admin_verified_at && new Date(order.admin_verified_at) < startMonth).length;

  return Array.from({ length: monthCount }, (_, index) => {
    const month = new Date(Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() + index, 1));
    const nextMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));
    startedTotal += validOrders.filter((order) => {
      const paidAt = new Date(order.payment_confirmed_at ?? order.created_at);
      return paidAt >= month && paidAt < nextMonth;
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

export function boardKeyForFulfilment(status: FulfilmentStatus): CustomerBoardKey | null {
  if (status === "ready" || status === "broadcasting" || status === "not_ready") return "waiting";
  if (status === "assigned" || status === "in_progress" || status === "revision_required") return "active";
  if (status === "proof_submitted" || status === "verified") return "review";
  return null;
}

export function customerStepIndex(fulfilment: FulfilmentStatus, delivery: DeliveryStatus): number {
  if (delivery === "delivered") return 3;
  if (fulfilment === "proof_submitted" || fulfilment === "verified") return 2;
  if (fulfilment === "assigned" || fulfilment === "in_progress" || fulfilment === "revision_required") return 1;
  return 0;
}
