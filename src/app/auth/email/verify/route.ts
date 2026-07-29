import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isCustomerAccount } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { createClient, getProfile } from "@/lib/supabase/server";

function loginRedirect(request: NextRequest, message: string) {
  const url = new URL("/login", request.nextUrl.origin);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const email = cookieStore.get("as_customer_email")?.value;
  const next = safeRedirectPath(cookieStore.get("as_customer_next")?.value, "/dashboard");
  const token = String((await request.formData()).get("token") ?? "").trim();
  if (!email || !/^\d{6}$/.test(token)) return loginRedirect(request, "Enter the six-digit code from your email.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error || !data.user) return loginRedirect(request, "That code is invalid or has expired. Request a new code and try again.");

  const profile = await getProfile(supabase, data.user.id);
  if (!await isCustomerAccount(supabase, data.user, profile)) {
    await supabase.auth.signOut();
    return loginRedirect(request, profile?.status === "suspended" ? "This account is suspended. Contact As-Sabiqun for help." : "This account is not ready yet.");
  }

  const response = NextResponse.redirect(new URL(next, request.nextUrl.origin));
  response.cookies.delete("as_customer_email");
  response.cookies.delete("as_customer_next");
  return response;
}
