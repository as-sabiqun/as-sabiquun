"use client";

import { useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import styles from "./checkout.module.css";

export function CheckoutButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/hitpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const result = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error || "Secure checkout could not be opened.");
      window.location.assign(result.checkoutUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Secure checkout could not be opened.");
      setLoading(false);
    }
  }

  return (
    <div className={styles.payAction}>
      {error && <p role="alert">{error}</p>}
      <button type="button" onClick={pay} disabled={loading}>
        <LockKeyhole aria-hidden="true" /> {loading ? "Opening secure checkout…" : "Pay securely with HitPay"} <ArrowRight aria-hidden="true" />
      </button>
      <small>You will complete payment on HitPay’s secure hosted page.</small>
    </div>
  );
}

