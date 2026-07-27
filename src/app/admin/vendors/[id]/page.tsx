import { notFound, redirect } from "next/navigation";
import { adminHasAccess, getAal2AdminAtLeast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VendorDetailReal, type VendorDetail, type VendorPaymentRow, type VendorOrderRow } from "@/components/admin/vendor-detail-real";

export default async function AdminVendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const currentAdmin = await getAal2AdminAtLeast(supabase, "operations");
  if (!currentAdmin) redirect("/admin/sign-in");
  const canManageFinance = adminHasAccess(currentAdmin.profile, "administrator");
  const admin = createAdminClient();
  const [{ data: profile }, { data: authUser }, { data: orders }, { data: paymentsData }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, display_name, contact_person, phone, whatsapp, country, city_address, vendor_type, services, status, vendor_onboarding_status, currency, bank_name, bank_account_name, bank_account_number, swift_code, rating, notes, created_at"
      )
      .eq("id", id)
      .eq("role", "vendor")
      .maybeSingle(),
    admin.auth.admin.getUserById(id),
    supabase
      .from("orders")
      .select(
        "id, reference, service_type, category_slug, quantity, participant_names, dedication, total_amount, vendor_payout_amount, offering_title, status, payment_status, fulfilment_status, delivery_status, settlement_status, created_at, accepted_at, completed_at, completion_deadline, offerings(title)"
      )
      .eq("assigned_vendor_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("vendor_payments")
      .select("id, order_id, amount, payment_date, method, reference, orders(reference)")
      .eq("vendor_id", id)
      .order("payment_date", { ascending: false }),
  ]);

  if (!profile) notFound();

  const payments: VendorPaymentRow[] = (paymentsData ?? []).map((p) => ({
    id: p.id,
    order_id: p.order_id,
    amount: p.amount,
    payment_date: p.payment_date,
    method: p.method,
    reference: p.reference,
    order_reference: (p.orders as unknown as { reference: string } | null)?.reference ?? null,
  }));

  const ordersList = (orders ?? []) as unknown as VendorOrderRow[];
  const totalPayable = ordersList
    .filter((o) => o.fulfilment_status === "verified")
    .reduce((sum, o) => sum + o.vendor_payout_amount, 0);

  const vendor: VendorDetail = { ...profile, email: authUser.user?.email ?? "—" };

  return <VendorDetailReal vendor={vendor} orders={ordersList} payments={payments} totalPayable={totalPayable} canManageFinance={canManageFinance} />;
}
