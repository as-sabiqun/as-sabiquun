import type { UserRole } from "@/lib/supabase/server";

export const HOME_FOR_ROLE: Record<UserRole, string> = {
  customer: "/dashboard",
  vendor: "/vendor-dashboard",
  admin: "/admin",
};

export function safeRedirectPath(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;

  try {
    const url = new URL(value, "https://as-sabiquun.local");
    return url.origin === "https://as-sabiquun.local" ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}
