import { createClient } from "@/lib/supabase/server";
import { fetchVendorJobs } from "@/lib/vendor-orders-fetch";
import { DashboardOverviewReal } from "@/components/vendor/dashboard-overview-real";

export default async function VendorDashboardPage() {
  const supabase = await createClient();
  const jobs = await fetchVendorJobs(supabase);
  return <DashboardOverviewReal jobs={jobs} />;
}
