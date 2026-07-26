import { NextRequest, NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const loginWithError = () => {
    const login = new URL("/login", request.nextUrl.origin);
    login.searchParams.set("error", "Google sign-in is not configured on this deployment yet.");
    return NextResponse.redirect(login);
  };

  if (!isSupabaseConfigured) return loginWithError();

  const callback = new URL("/auth/callback", request.nextUrl.origin);
  callback.searchParams.set("next", safeRedirectPath(request.nextUrl.searchParams.get("next"), "/dashboard"));
  callback.searchParams.set("intent", "customer");

  try {
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
