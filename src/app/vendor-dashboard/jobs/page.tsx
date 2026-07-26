import { createClient } from "@/lib/supabase/server";
import { fetchVendorJobs } from "@/lib/vendor-orders-fetch";
import { JobsListReal } from "@/components/vendor/jobs-list-real";

export default async function VendorJobsPage() {
  const supabase = await createClient();
  const jobs = await fetchVendorJobs(supabase);
  return <JobsListReal jobs={jobs} />;
}
