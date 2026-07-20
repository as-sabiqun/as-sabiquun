import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomerDashboard } from "@/components/customer-dashboard";
import { arePortalDemosEnabled, createServerSupabase, isAuthConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Customer dashboard",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isAuthConfigured) {
    if (!arePortalDemosEnabled) redirect("/login?portal=customer");
    return <CustomerDashboard />;
  }

  const supabase = await createServerSupabase();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "vendor") redirect("/vendor-dashboard");
  if (!profile) redirect("/onboarding");
  if (profile.role !== "customer") redirect("/login?error=wrong-portal");

  return <CustomerDashboard />;
}
