import { notFound, redirect } from "next/navigation";
import { getAal2Admin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomerDetailReal, type CustomerDetail, type CustomerOrderRow } from "@/components/admin/customer-detail-real";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  if (!(await getAal2Admin(supabase))) redirect("/admin/sign-in");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, phone, status, created_at")
    .eq("id", id)
    .eq("role", "customer")
    .maybeSingle();

  if (!profile) notFound();

  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(id);

  const { data: orders } = await supabase
    .from("orders")
    .select("id, reference, service_type, category_slug, quantity, participant_names, dedication, total_amount, offering_title, status, payment_status, fulfilment_status, delivery_status, settlement_status, created_at, offerings(title)")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  const customer: CustomerDetail = {
    ...profile,
    email: authUser.user?.email ?? "—",
    verified: Boolean(authUser.user?.email_confirmed_at),
  };

  return <CustomerDetailReal customer={customer} orders={(orders ?? []) as unknown as CustomerOrderRow[]} />;
}
