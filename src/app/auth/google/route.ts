import { NextRequest, NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createClient, isSupabaseAdminConfigured } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const loginWithError = (message = "Google sign-in is not configured on this deployment yet.") => {
    const login = new URL("/login", request.nextUrl.origin);
    login.searchParams.set("error", message);
    return NextResponse.redirect(login);
  };

  if (!isSupabaseAdminConfigured) return loginWithError();

  const callback = new URL("/auth/callback", request.nextUrl.origin);
  callback.searchParams.set("next", safeRedirectPath(request.nextUrl.searchParams.get("next"), "/dashboard"));
  callback.searchParams.set("intent", "customer");

  try {
    const address = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!await consumeRateLimit("google-auth", address, 10, 600)) {
      return loginWithError("Too many sign-in attempts. Please wait a few minutes and try again.");
    }
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });

    if (error || !data.url) return loginWithError();

    return NextResponse.redirect(data.url);
  } catch {
    return loginWithError();
  }
}
