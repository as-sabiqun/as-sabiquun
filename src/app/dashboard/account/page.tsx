import { CheckCircle2, Mail, MessageCircle, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { TelegramLinkCard } from "./telegram-link-card";
import styles from "../dashboard.module.css";

interface AccountProfile {
  display_name: string;
  phone: string | null;
  telegram_username: string | null;
  telegram_linked_at: string | null;
}

export default async function CustomerAccountPage({ searchParams }: PageProps<"/dashboard/account">) {
  const supabase = await createClient();
  const user = (await getCurrentUser(supabase))!;
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, phone, telegram_username, telegram_linked_at")
    .eq("id", user.id)
    .single();
  if (error) throw new Error("Account details could not be loaded.");
  const profile = data as AccountProfile | null;
  const telegramLinked = Boolean(profile?.telegram_linked_at);
  const requestedNext = (await searchParams).next;
  const next = safeRedirectPath(typeof requestedNext === "string" ? requestedNext : null, "");
  if (telegramLinked && next) redirect(next);

  return (
    <div className={styles.subpage}>
      <header className={styles.subpageHeader}><div><p>Account</p><h1>Your identity and delivery channels.</h1></div></header>
      <div className={styles.accountGrid}>
        <section className={styles.accountPanel}>
          <header><span><UserRound aria-hidden="true" /></span><div><p>Personal details</p><h2>{profile?.display_name || "Customer"}</h2></div></header>
          <dl className={styles.accountFacts}>
            <div><dt><Mail aria-hidden="true" /> Google email</dt><dd>{user.email}</dd></div>
            <div><dt>Phone</dt><dd>{profile?.phone || "Not provided"}</dd></div>
          </dl>
          <p className={styles.accountNote}>Customer access is protected by your verified Google account.</p>
        </section>

        <section className={styles.accountPanel}>
          <header><span><MessageCircle aria-hidden="true" /></span><div><p>Report delivery</p><h2>Telegram</h2></div></header>
          {telegramLinked ? (
            <div className={styles.connectedState}><CheckCircle2 aria-hidden="true" /><div><strong>Connected</strong><p>{profile?.telegram_username ? `@${profile.telegram_username.replace(/^@/, "")}` : "Your Telegram account is linked."}</p></div></div>
          ) : (
            <>
              <p className={styles.accountNote}>Connect Telegram before checkout so your completion report can be sent through both required channels.</p>
              <TelegramLinkCard />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
