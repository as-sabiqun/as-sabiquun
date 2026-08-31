import "server-only";

export type OnlinePaymentProvider = "hitpay" | "airwallex";

export function configuredPaymentProvider(): OnlinePaymentProvider {
  return process.env.PAYMENT_PROVIDER?.trim().toLowerCase() === "airwallex" ? "airwallex" : "hitpay";
}
