import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { fetchVendorJobs } from "@/lib/vendor-orders-fetch";
import { BoardDemo } from "@/components/vendor/board-demo";
import { BoardReal } from "@/components/vendor/board-real";

export default async function VendorBoardPage() {
  if (!isSupabaseConfigured) return <BoardDemo />;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <BoardReal jobs={[]} />;

  const jobs = await fetchVendorJobs(supabase, userData.user.id);
  return <BoardReal jobs={jobs} />;
}
