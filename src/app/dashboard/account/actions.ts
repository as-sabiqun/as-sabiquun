"use server";

import { createClient, getProfile } from "@/lib/supabase/server";
import { isGoogleCustomer } from "@/lib/auth";

export type TelegramLinkState = { url?: string; expiresAt?: string; error?: string } | undefined;

export async function createTelegramLink(): Promise<TelegramLinkState> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Sign in with Google before linking Telegram." };
  const profile = await getProfile(supabase, userData.user.id);
  if (!await isGoogleCustomer(supabase, userData.user, profile)) return { error: "Sign in with a verified Google customer account." };

  const username = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "");
  if (!username || !/^[A-Za-z0-9_]{5,}$/.test(username)) return { error: "Telegram linking is not configured yet." };

  const { data, error } = await supabase.rpc("create_telegram_link_token");
  if (error || !data) return { error: "We could not create the link. Please try again." };
  const value = (Array.isArray(data) ? data[0] : data) as { token?: string; expires_at?: string };
  if (!value?.token || !value.expires_at) return { error: "We could not create the link. Please try again." };

  const url = new URL(`https://t.me/${username}`);
  url.searchParams.set("start", value.token);
  return { url: url.toString(), expiresAt: value.expires_at };
}
