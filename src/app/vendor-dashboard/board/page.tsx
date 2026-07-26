import { createClient } from "@/lib/supabase/server";
import { fetchVendorJobs } from "@/lib/vendor-orders-fetch";
import { BoardReal } from "@/components/vendor/board-real";

export default async function VendorBoardPage() {
  const supabase = await createClient();
  const jobs = await fetchVendorJobs(supabase);
  return <BoardReal jobs={jobs} />;
}
