import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ReportsDemo } from "@/components/admin/reports-demo";
import { ReportsReal, type ReportRow } from "@/components/admin/reports-real";

export default async function AdminReportsPage() {
  if (!isSupabaseConfigured) return <ReportsDemo />;

  const supabase = await createClient();
  const { data } = await supabase
    .from("vendor_reports")
    .select("id, subject, message, status, created_at, vendor:profiles!vendor_reports_vendor_id_fkey(display_name), orders(reference)")
    .order("created_at", { ascending: false });

  const reports: ReportRow[] = (data ?? []).map((r) => ({
    id: r.id,
    subject: r.subject,
    message: r.message,
    status: r.status,
    created_at: r.created_at,
    vendor_name: (r.vendor as unknown as { display_name: string } | null)?.display_name ?? "Unknown vendor",
    order_reference: (r.orders as unknown as { reference: string } | null)?.reference ?? null,
  }));

  return <ReportsReal reports={reports} />;
}
