import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { fetchVendorJobs } from "@/lib/vendor-orders-fetch";
import { JobsListDemo } from "@/components/vendor/jobs-list-demo";
import { JobsListReal } from "@/components/vendor/jobs-list-real";

export default async function VendorJobsPage() {
  if (!isSupabaseConfigured) return <JobsListDemo />;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <JobsListReal jobs={[]} />;

  const jobs = await fetchVendorJobs(supabase, userData.user.id);
  return <JobsListReal jobs={jobs} />;
}
