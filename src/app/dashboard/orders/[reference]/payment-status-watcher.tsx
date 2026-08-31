"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function PaymentStatusWatcher({ orderId, provider }: { orderId: string; provider: string }) {
  const router = useRouter();
  const [delayed, setDelayed] = useState(false);

  useEffect(() => {
    let stopped = false;
    let attempts = 0;
    const check = async () => {
      attempts += 1;
      try {
        if (provider === "airwallex") {
          const response = await fetch("/api/payments/airwallex/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId }),
          });
          const result = await response.json() as { status?: string };
          if (response.ok && ["succeeded", "cancelled"].includes(result.status ?? "")) {
            router.refresh();
            return;
          }
        } else {
          router.refresh();
        }
      } catch {
        // The signed webhook may still arrive; continue bounded polling.
      }
      if (!stopped && attempts < 12) window.setTimeout(check, 2_500);
      else if (!stopped) setDelayed(true);
    };
    void check();
    return () => { stopped = true; };
  }, [orderId, provider, router]);

  return delayed
    ? <span>Payment confirmation is taking longer than usual. You can safely refresh this page later.</span>
    : <span>Checking your payment securely…</span>;
}
