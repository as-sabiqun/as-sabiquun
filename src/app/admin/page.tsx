import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { PendingJobsDemo } from "@/components/admin/pending-jobs-demo";
import { PendingJobsReal, type AdminOrderRow } from "@/components/admin/pending-jobs-real";

export default async function AdminPendingJobsPage() {
  if (!isSupabaseConfigured) return <PendingJobsDemo />;

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, reference, service_type, category_slug, quantity, participant_names, dedication, total_amount, status, created_at, customer_name, offerings(title), assigned_vendor:profiles!orders_assigned_vendor_id_fkey(display_name)")
    .order("created_at", { ascending: false });

  return <PendingJobsReal orders={(data ?? []) as unknown as AdminOrderRow[]} />;
}
