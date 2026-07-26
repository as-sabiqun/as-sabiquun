export async function prepareCompletionReportsBeforeDelivery<TCustomer, TInternal>(steps: {
  prepareCustomer: () => Promise<TCustomer>;
  prepareInternal: () => Promise<TInternal>;
  queueDelivery: (customer: TCustomer) => Promise<void>;
}) {
  const customer = await steps.prepareCustomer();
  const internal = await steps.prepareInternal();
  await steps.queueDelivery(customer);
  return { customer, internal };
}

export type CompletionReportAction = "generate_bundle" | "recover_internal" | "queue_delivery" | null;

export function getCompletionReportAction(input: {
  verified: boolean;
  deliveryComplete: boolean;
  notificationCount: number;
  hasCustomerReport: boolean;
  hasInternalReport: boolean;
}): CompletionReportAction {
  if (!input.verified) return null;
  if (!input.hasInternalReport) {
    return input.hasCustomerReport ? "recover_internal" : "generate_bundle";
  }
  if (!input.deliveryComplete && input.notificationCount === 0) {
    return input.hasCustomerReport ? "queue_delivery" : "generate_bundle";
  }
  return null;
}
