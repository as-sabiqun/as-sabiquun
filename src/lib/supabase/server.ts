import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export const isSupabaseAdminConfigured = Boolean(isSupabaseConfigured && process.env.SUPABASE_SERVICE_ROLE_KEY);

export type UserRole = "customer" | "vendor" | "admin";

export function getUserRole(user: { user_metadata?: Record<string, unknown> } | null | undefined): UserRole | null {
  const role = user?.user_metadata?.role;
  return role === "customer" || role === "vendor" || role === "admin" ? role : null;
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
