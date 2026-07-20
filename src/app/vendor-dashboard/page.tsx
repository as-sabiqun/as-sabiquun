import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VendorDashboard } from "@/components/vendor-dashboard";
import { arePortalDemosEnabled, createServerSupabase, isAuthConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Vendor dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  if (!isAuthConfigured && !arePortalDemosEnabled) redirect("/login?portal=vendor");

  if (isAuthConfigured) {
    const supabase = await createServerSupabase();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (!userId) redirect("/login?portal=vendor");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    if (profile?.role === "admin") redirect("/admin");
    if (profile?.role !== "vendor") redirect("/login?error=wrong-portal");
  }

  return <VendorDashboard />;
}
