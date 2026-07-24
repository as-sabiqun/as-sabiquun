import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ReportsDemo } from "@/components/vendor/reports-demo";
import { ReportsReal } from "@/components/vendor/reports-real";

export default async function VendorReportsPage() {
  if (!isSupabaseConfigured) return <ReportsDemo />;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <ReportsReal vendorId="" reports={[]} jobOptions={[]} />;

  const [{ data: reports }, { data: orders }] = await Promise.all([
    supabase
      .from("vendor_reports")
      .select("id, subject, message, status, created_at, orders(reference)")
      .eq("vendor_id", userData.user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id, reference, offerings(title)")
      .eq("assigned_vendor_id", userData.user.id),
  ]);

  const reportRows = (reports ?? []).map((r) => ({
    id: r.id,
    subject: r.subject,
    message: r.message,
    status: r.status,
    created_at: r.created_at,
    order_reference: (r.orders as unknown as { reference: string } | null)?.reference ?? null,
  }));

  const jobOptions = (orders ?? []).map((o) => ({
    orderId: o.id,
    reference: o.reference,
    title: (o.offerings as unknown as { title: string } | null)?.title ?? "Order",
  }));

  return <ReportsReal vendorId={userData.user.id} reports={reportRows} jobOptions={jobOptions} />;
}
