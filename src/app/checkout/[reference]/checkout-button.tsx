"use client";

import { useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { init } from "@airwallex/components-sdk";
import styles from "./checkout.module.css";

type Provider = "hitpay" | "airwallex";

interface AirwallexCheckout {
  intentId: string;
  clientSecret: string;
  currency: string;
  environment: "sandbox" | "prod";
  successUrl: string;
  cancelUrl: string;
  logoUrl: string;
  shopperName: string;
  shopperEmail: string;
  shopperPhone: string | null;
  error?: string;
}

let airwallexInit: Promise<Awaited<ReturnType<typeof init>>> | null = null;

async function openAirwallexCheckout(result: AirwallexCheckout) {
  airwallexInit ??= init({ env: result.environment, locale: "en", enabledElements: ["payments"] });
  const sdk = await airwallexInit;
  if (!sdk.payments) throw new Error("Airwallex checkout did not initialize.");
  const options = {
    env: result.environment === "prod" ? "prod" as const : "demo" as const,
    mode: "payment" as const,
    intent_id: result.intentId,
    client_secret: result.clientSecret,
    currency: result.currency,
    successUrl: result.successUrl,
    cancelUrl: result.cancelUrl,
    logoUrl: result.logoUrl,
    shopper_name: result.shopperName,
    shopper_email: result.shopperEmail,
    ...(result.shopperPhone ? { shopper_phone: result.shopperPhone } : {}),
    autoCapture: true,
    autoSaveCardForFuturePayments: false,
    appearance: {
      mode: "light" as const,
      variables: { colorBrand: "#087c72", colorBackground: "#ffffff", colorText: "#132f2d" },
    },
  };
  sdk.payments.redirectToCheckout(options);
}

export function CheckoutButton({ orderId, provider }: { orderId: string; provider: Provider }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/payments/${provider}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const result = await response.json() as AirwallexCheckout & { checkoutUrl?: string };
      if (!response.ok) throw new Error(result.error || "Secure checkout could not be opened.");
      if (provider === "airwallex") {
        if (!result.intentId || !result.clientSecret) throw new Error("Airwallex checkout could not be opened.");
        await openAirwallexCheckout(result);
      } else {
        if (!result.checkoutUrl) throw new Error("Secure checkout could not be opened.");
        window.location.assign(result.checkoutUrl);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Secure checkout could not be opened.");
      setLoading(false);
    }
  }

  return (
    <div className={styles.payAction}>
      {error && <p role="alert">{error}</p>}
      <button type="button" onClick={pay} disabled={loading}>
        <LockKeyhole aria-hidden="true" /> {loading ? "Opening secure checkout…" : "Continue to secure payment"} <ArrowRight aria-hidden="true" />
      </button>
      <small>You’ll choose your payment method on {provider === "airwallex" ? "Airwallex" : "HitPay"} and return here automatically.</small>
    </div>
  );
}
