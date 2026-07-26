"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, RefreshCw } from "lucide-react";
import { createTelegramLink, type TelegramLinkState } from "./actions";
import styles from "../dashboard.module.css";

export function TelegramLinkCard() {
  const router = useRouter();
  const [state, action, pending] = useActionState<TelegramLinkState, FormData>(() => createTelegramLink(), undefined);

  return (
    <div className={styles.connectionActions}>
      {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
      {state?.url ? (
        <>
          <a href={state.url} target="_blank" rel="noreferrer" className={styles.primaryAction}>Open Telegram <ExternalLink aria-hidden="true" /></a>
          <p>This one-time link expires {new Date(state.expiresAt!).toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" })}. Start the bot, then refresh this page.</p>
          <button type="button" className={styles.secondaryAction} onClick={() => router.refresh()}><RefreshCw aria-hidden="true" /> Refresh status</button>
        </>
      ) : (
        <form action={action}><button type="submit" className={styles.primaryAction} disabled={pending}>{pending ? "Creating link…" : "Connect Telegram"}</button></form>
      )}
    </div>
  );
}

