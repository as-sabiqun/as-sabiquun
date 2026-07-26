import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS and can create/manage users directly.
 * Server-only. Never import this from a Client Component or expose the key to the browser.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey) throw new Error("Supabase server secret is not configured.");

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
