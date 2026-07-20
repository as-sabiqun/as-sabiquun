import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { arePortalDemosEnabled, createServerSupabase, isAuthConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin workspace",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isAuthConfigured && !arePortalDemosEnabled) redirect("/admin/sign-in?unavailable=1");

  if (isAuthConfigured) {
    const supabase = await createServerSupabase();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (!userId) redirect("/admin/sign-in");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    if (profile?.role !== "admin") redirect("/login?error=wrong-portal");
  }

  return <AdminDashboard />;
}
