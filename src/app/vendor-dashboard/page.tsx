import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { fetchVendorJobs } from "@/lib/vendor-orders-fetch";
import { DashboardOverviewDemo } from "@/components/vendor/dashboard-overview-demo";
import { DashboardOverviewReal } from "@/components/vendor/dashboard-overview-real";

export default async function VendorDashboardPage() {
  if (!isSupabaseConfigured) return <DashboardOverviewDemo />;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <DashboardOverviewReal jobs={[]} />;

  const jobs = await fetchVendorJobs(supabase, userData.user.id);
  return <DashboardOverviewReal jobs={jobs} />;
}
