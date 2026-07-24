import { notFound } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomerDetailDemo } from "@/components/admin/customer-detail-demo";
import { CustomerDetailReal, type CustomerDetail } from "@/components/admin/customer-detail-real";
import type { OrderRow } from "@/lib/orders";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isSupabaseConfigured) return <CustomerDetailDemo id={id} />;

  const supabase = await createClient();
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
    .select("id, reference, service_type, category_slug, quantity, participant_names, dedication, total_amount, status, created_at, offerings(title)")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  const customer: CustomerDetail = {
    ...profile,
    email: authUser.user?.email ?? "—",
    verified: Boolean(authUser.user?.email_confirmed_at),
  };

  return <CustomerDetailReal customer={customer} orders={(orders ?? []) as unknown as OrderRow[]} />;
}
