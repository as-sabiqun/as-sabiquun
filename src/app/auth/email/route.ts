import { NextRequest, NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createClient, isSupabaseAdminConfigured } from "@/lib/supabase/server";

function loginRedirect(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/login", request.nextUrl.origin);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return NextResponse.redirect(url);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeRedirectPath(String(formData.get("next") ?? ""), "/dashboard");
  if (!/^\S+@\S+\.\S+$/.test(email)) return loginRedirect(request, { error: "Enter a valid email address.", next });
  if (!isSupabaseAdminConfigured) return loginRedirect(request, { error: "Email sign-in is not configured on this deployment yet.", next });

  const address = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!await consumeRateLimit("email-auth", address, 5, 600)) {
    return loginRedirect(request, { error: "Too many email requests. Please wait a few minutes and try again.", next });
  }

  const callback = new URL("/auth/callback", request.nextUrl.origin);
  callback.searchParams.set("next", next);
  callback.searchParams.set("intent", "customer");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callback.toString() } });
  if (error) return loginRedirect(request, { error: "We could not send that sign-in link. Please try again.", next });
  return loginRedirect(request, { sent: "email", next });
}
