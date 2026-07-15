import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && publicKey && process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function createServerSupabase() {
  if (!url || !publicKey) throw new Error("Supabase is not configured.");
  const cookieStore = await cookies();
  return createServerClient(url, publicKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Components cannot set cookies. */ }
      },
    },
  });
}

export function createServiceSupabase() {
  if (!url || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase service access is not configured.");
  return createSupabaseClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
