import { isPaid, type DeliveryStatus, type FulfilmentStatus, type PaymentStatus } from "./order-lifecycle.ts";

export type CustomerDirectoryState = "ready" | "needs_setup" | "suspended";

export interface CustomerDirectoryRecord {
  verified: boolean;
  telegramLinked: boolean;
  status: "active" | "suspended";
  paidOrdersCount: number;
  activeProjects: number;
  completedProjects: number;
  lifetimeSpendCents: number;
}

export interface CustomerOrderInput {
  total_amount: number;
  payment_provider: string;
  payment_status: PaymentStatus;
  fulfilment_status: FulfilmentStatus;
  delivery_status: DeliveryStatus;
  payment_transactions?: Array<{ transaction_type: "payment" | "refund"; amount: number; status: string }> | null;
}

export function customerDirectoryState(customer: Pick<CustomerDirectoryRecord, "verified" | "telegramLinked" | "status">): CustomerDirectoryState {
  if (customer.status === "suspended") return "suspended";
  return customer.verified && customer.telegramLinked ? "ready" : "needs_setup";
}

export function customerReadinessDetail(customer: Pick<CustomerDirectoryRecord, "verified" | "telegramLinked" | "status">) {
  if (customer.status === "suspended") return "Customer access paused";
  if (customer.verified && customer.telegramLinked) return "Email + Telegram connected";
  if (!customer.verified && !customer.telegramLinked) return "Email + Telegram incomplete";
  return customer.verified ? "Telegram not linked" : "Email verification needed";
}

export function customerOrderMetrics(orders: CustomerOrderInput[]) {
  return orders.reduce((metrics, order) => {
    if (order.payment_provider !== "hitpay" || !isPaid(order.payment_status)) return metrics;
    const refunds = (order.payment_transactions ?? [])
      .filter((transaction) => transaction.transaction_type === "refund" && transaction.status === "succeeded")
      .reduce((total, transaction) => total + transaction.amount, 0);

    metrics.paidOrdersCount += 1;
    metrics.lifetimeSpendCents += Math.max(0, order.total_amount - refunds);
    if (order.delivery_status === "delivered") metrics.completedProjects += 1;
    else if (order.fulfilment_status !== "cancelled") metrics.activeProjects += 1;
    return metrics;
  }, { paidOrdersCount: 0, activeProjects: 0, completedProjects: 0, lifetimeSpendCents: 0 });
}

export function customerDirectorySummary(customers: CustomerDirectoryRecord[]) {
  return customers.reduce((summary, customer) => {
    summary.verified += Number(customer.verified);
    summary.telegramLinked += Number(customer.telegramLinked);
    summary.ready += Number(customerDirectoryState(customer) === "ready");
    summary.paidOrders += customer.paidOrdersCount;
    summary.activeProjects += customer.activeProjects;
    summary.completedProjects += customer.completedProjects;
    summary.lifetimeSpendCents += customer.lifetimeSpendCents;
    return summary;
  }, { verified: 0, telegramLinked: 0, ready: 0, paidOrders: 0, activeProjects: 0, completedProjects: 0, lifetimeSpendCents: 0 });
}
