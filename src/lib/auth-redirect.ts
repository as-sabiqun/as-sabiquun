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

export function safeAdminRedirectPath(value: string | null | undefined, fallback = "/admin") {
  const path = safeRedirectPath(value, fallback);
  if (path !== "/admin" && !path.startsWith("/admin/")) return fallback;
  if (path === "/admin/sign-in" || path.startsWith("/admin/sign-in/") || path === "/admin/mfa" || path.startsWith("/admin/mfa/")) return fallback;
  return path;
}

export function safeVendorRedirectPath(value: string | null | undefined, fallback = "/vendor-dashboard") {
  const path = safeRedirectPath(value, fallback);
  return path === "/vendor-dashboard" || path.startsWith("/vendor-dashboard/") ? path : fallback;
}
