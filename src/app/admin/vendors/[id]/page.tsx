import { notFound } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VendorDetailDemo } from "@/components/admin/vendor-detail-demo";
import { VendorDetailReal, type VendorDetail, type VendorPaymentRow } from "@/components/admin/vendor-detail-real";
import type { OrderRow } from "@/lib/orders";

export default async function AdminVendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isSupabaseConfigured) return <VendorDetailDemo id={id} />;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, contact_person, phone, whatsapp, country, city_address, vendor_type, services, status, currency, bank_name, bank_account_name, bank_account_number, swift_code, rating, notes, created_at"
    )
    .eq("id", id)
    .eq("role", "vendor")
    .maybeSingle();

  if (!profile) notFound();

  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(id);

  const { data: orders } = await supabase
    .from("orders")
    .select("id, reference, service_type, category_slug, quantity, participant_names, dedication, total_amount, vendor_payout_amount, status, created_at, offerings(title)")
    .eq("assigned_vendor_id", id)
    .order("created_at", { ascending: false });

  const { data: paymentsData } = await supabase
    .from("vendor_payments")
    .select("id, amount, payment_date, method, reference, orders(reference)")
    .eq("vendor_id", id)
    .order("payment_date", { ascending: false });

  const payments: VendorPaymentRow[] = (paymentsData ?? []).map((p) => ({
    id: p.id,
    amount: p.amount,
    payment_date: p.payment_date,
    method: p.method,
    reference: p.reference,
    order_reference: (p.orders as unknown as { reference: string } | null)?.reference ?? null,
  }));

  const ordersList = (orders ?? []) as unknown as (OrderRow & { vendor_payout_amount: number })[];
  const totalPayable = ordersList
    .filter((o) => ["assigned", "in_progress", "proof_submitted", "completed"].includes(o.status))
    .reduce((sum, o) => sum + o.vendor_payout_amount, 0);

  const vendor: VendorDetail = { ...profile, email: authUser.user?.email ?? "—" };

  return <VendorDetailReal vendor={vendor} orders={ordersList} payments={payments} totalPayable={totalPayable} />;
}
