import { NextResponse, type NextRequest } from "next/server";
import { HOME_FOR_ROLE, safeRedirectPath } from "@/lib/auth-redirect";
import { createClient, getProfile } from "@/lib/supabase/server";

function appOrigin(request: NextRequest) {
  return process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
}

function loginError(request: NextRequest, message: string) {
  const url = new URL("/login", appOrigin(request));
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return loginError(request, "This sign-in link is invalid or has expired.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return loginError(request, "Sign-in could not be completed. Please try again.");

  const profile = await getProfile(supabase, data.user.id);
  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    return loginError(request, profile?.status === "suspended" ? "This account is suspended. Contact As-Sābiqūn for help." : "This account is not ready yet.");
  }

  if (request.nextUrl.searchParams.get("intent") === "customer" && profile.role !== "customer") {
    await supabase.auth.signOut();
    return loginError(request, "Staff and fulfilment partners must use their assigned email and password.");
  }

  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"), HOME_FOR_ROLE[profile.role]);
  return NextResponse.redirect(new URL(next, appOrigin(request)));
}
