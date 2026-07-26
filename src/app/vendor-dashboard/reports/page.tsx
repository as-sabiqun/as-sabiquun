import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { ReportsReal } from "@/components/vendor/reports-real";

export default async function VendorReportsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return <ReportsReal vendorId="" reports={[]} jobOptions={[]} />;

  const [{ data: reports, error: reportsError }, { data: orders, error: ordersError }] = await Promise.all([
    supabase
      .from("vendor_reports")
      .select("id, order_id, subject, message, status, created_at, resolved_at, resolution_notes")
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("vendor_assigned_orders")
      .select("id, reference, offering_title"),
  ]);
  if (reportsError || ordersError) throw new Error("Partner reports could not be loaded.");

  const orderById = new Map((orders ?? []).map((order) => [order.id, order]));

  const reportRows = (reports ?? []).map((r) => ({
    id: r.id,
    subject: r.subject,
    message: r.message,
    status: r.status,
    created_at: r.created_at,
    resolved_at: r.resolved_at,
    resolution_notes: r.resolution_notes,
    order_reference: r.order_id ? orderById.get(r.order_id)?.reference ?? null : null,
  }));

  const jobOptions = (orders ?? []).map((o) => ({
    orderId: o.id,
    reference: o.reference,
    title: o.offering_title ?? "Order",
  }));

  return <ReportsReal vendorId={user.id} reports={reportRows} jobOptions={jobOptions} />;
}
