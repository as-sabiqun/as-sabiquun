import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ReportsDemo } from "@/components/admin/reports-demo";
import { ReportsReal, type ReportRow } from "@/components/admin/reports-real";

export default async function AdminReportsPage() {
  if (!isSupabaseConfigured) return <ReportsDemo />;

  const supabase = await createClient();
  const [{ data: vendorData }, { data: customerData }] = await Promise.all([
    supabase
      .from("vendor_reports")
      .select("id, subject, message, status, created_at, vendor:profiles!vendor_reports_vendor_id_fkey(display_name), orders(reference)"),
    supabase
      .from("customer_reports")
      .select("id, subject, message, status, created_at, customer:profiles!customer_reports_customer_id_fkey(display_name), orders(reference)"),
  ]);

  const vendorReports: ReportRow[] = (vendorData ?? []).map((r) => ({
    id: r.id,
    subject: r.subject,
    message: r.message,
    status: r.status,
    created_at: r.created_at,
    reporter_name: (r.vendor as unknown as { display_name: string } | null)?.display_name ?? "Unknown vendor",
    order_reference: (r.orders as unknown as { reference: string } | null)?.reference ?? null,
    source: "vendor",
  }));

  const customerReports: ReportRow[] = (customerData ?? []).map((r) => ({
    id: r.id,
    subject: r.subject,
    message: r.message,
    status: r.status,
    created_at: r.created_at,
    reporter_name: (r.customer as unknown as { display_name: string } | null)?.display_name ?? "Unknown customer",
    order_reference: (r.orders as unknown as { reference: string } | null)?.reference ?? null,
    source: "customer",
  }));

  const reports = [...vendorReports, ...customerReports].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return <ReportsReal reports={reports} />;
}
