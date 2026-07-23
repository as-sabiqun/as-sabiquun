import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export const isSupabaseAdminConfigured = Boolean(isSupabaseConfigured && process.env.SUPABASE_SERVICE_ROLE_KEY);

export type UserRole = "customer" | "vendor" | "admin";

export interface Profile {
  id: string;
  display_name: string;
  role: UserRole;
  phone: string | null;
  vendor_type: string | null;
  services: string[];
  status: "active" | "suspended";
  created_at: string;
}

// role lives in the `profiles` table, never in user_metadata — an
// authenticated user can edit their own user_metadata from the client SDK,
// so it must never be trusted for authorization.
export async function getProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data as Profile | null;
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component with no writable cookie store —
            // safe to ignore when session refresh happens in proxy.ts instead.
          }
        },
      },
    }
  );
}
