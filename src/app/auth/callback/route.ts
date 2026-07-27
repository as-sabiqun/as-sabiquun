import { NextResponse, type NextRequest } from "next/server";
import { sessionUsesAuthMethod } from "@/lib/auth";
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

  const intent = request.nextUrl.searchParams.get("intent");
  const oauthSession = await sessionUsesAuthMethod(supabase, "oauth");
  if (intent === "customer") {
    const providers = Array.isArray(data.user.app_metadata.providers) ? data.user.app_metadata.providers : [];
    if (!oauthSession || profile.role !== "customer" || !providers.includes("google") || !data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      return loginError(request, "Customer access requires a verified Google account.");
    }
  } else if (intent === "vendor") {
    if (oauthSession || profile.role !== "vendor") {
      await supabase.auth.signOut();
      return loginError(request, "This partner invitation is not valid for this account.");
    }
  } else if (intent === "recovery") {
    if (oauthSession || !["vendor", "admin"].includes(profile.role)) {
      await supabase.auth.signOut();
      return loginError(request, "Password recovery is available only to invited staff and partners.");
    }
  } else if (intent === "admin") {
    if (oauthSession || profile.role !== "admin") {
      await supabase.auth.signOut();
      return loginError(request, "This administrator invitation is not valid for this account.");
    }
  } else {
    await supabase.auth.signOut();
    return loginError(request, "This sign-in link is invalid or has expired.");
  }

  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"), HOME_FOR_ROLE[profile.role]);
  return NextResponse.redirect(new URL(next, appOrigin(request)));
}
