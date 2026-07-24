import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomersListDemo } from "@/components/admin/customers-list-demo";
import { CustomersListReal, type CustomerRow } from "@/components/admin/customers-list-real";

export default async function AdminCustomersPage() {
  if (!isSupabaseConfigured) return <CustomersListDemo />;

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, phone, status")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  const admin = createAdminClient();
  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const authById = new Map(authList.users.map((u) => [u.id, u]));

  const ids = (profiles ?? []).map((p) => p.id);
  const { data: orders } = ids.length
    ? await supabase.from("orders").select("customer_id, total_amount").in("customer_id", ids)
    : { data: [] };

  const customers: CustomerRow[] = (profiles ?? []).map((p) => {
    const authUser = authById.get(p.id);
    const customerOrders = (orders ?? []).filter((o) => o.customer_id === p.id);
    return {
      id: p.id,
      display_name: p.display_name,
      email: authUser?.email ?? "—",
      phone: p.phone,
      verified: Boolean(authUser?.email_confirmed_at),
      status: p.status,
      ordersCount: customerOrders.length,
      lifetimeSpendCents: customerOrders.reduce((sum, o) => sum + o.total_amount, 0),
    };
  });

  return <CustomersListReal customers={customers} />;
}
