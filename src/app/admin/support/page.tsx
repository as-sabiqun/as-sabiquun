import { ReportsReal, type ReportRow } from "@/components/admin/reports-real";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const [{ data: vendorData, error: vendorError }, { data: customerData, error: customerError }] = await Promise.all([
    supabase.from("vendor_reports").select(`id, subject, message, status, created_at, resolved_at, resolution_notes,
      reporter:profiles!vendor_reports_vendor_id_fkey(display_name), resolver:profiles!vendor_reports_resolved_by_fkey(display_name), orders(reference)`),
    supabase.from("customer_reports").select(`id, category, subject, message, status, created_at, resolved_at, resolution_notes,
      reporter:profiles!customer_reports_customer_id_fkey(display_name), resolver:profiles!customer_reports_resolved_by_fkey(display_name), orders(reference)`),
  ]);

  const map = (row: Record<string, unknown>, source: "vendor" | "customer"): ReportRow => ({
    id: String(row.id),
    subject: String(row.subject),
    message: String(row.message),
    status: row.status as ReportRow["status"],
    created_at: String(row.created_at),
    resolved_at: row.resolved_at ? String(row.resolved_at) : null,
    resolution_notes: row.resolution_notes ? String(row.resolution_notes) : null,
    reporter_name: (row.reporter as { display_name?: string } | null)?.display_name ?? `Unknown ${source}`,
    resolver_name: (row.resolver as { display_name?: string } | null)?.display_name ?? null,
    order_reference: (row.orders as { reference?: string } | null)?.reference ?? null,
    source,
    category: row.category ? String(row.category) : null,
  });
  const reports = [
    ...(vendorData ?? []).map((row) => map(row as unknown as Record<string, unknown>, "vendor")),
    ...(customerData ?? []).map((row) => map(row as unknown as Record<string, unknown>, "customer")),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return <>{(vendorError || customerError) && <p className="auth-error">Some support data could not be loaded: {(vendorError || customerError)?.message}</p>}<ReportsReal reports={reports} /></>;
}
