import { NextRequest, NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const siteUrl = await getSiteUrl();
  const callback = new URL("/auth/callback", siteUrl);
  callback.searchParams.set("next", safeRedirectPath(request.nextUrl.searchParams.get("next"), "/dashboard"));
  callback.searchParams.set("intent", "customer");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });

  if (error || !data.url) {
    const login = new URL("/login", siteUrl);
    login.searchParams.set("error", "Google sign-in could not be started. Try email instead.");
    return NextResponse.redirect(login);
  }

  return NextResponse.redirect(data.url);
}
