import { redirect } from "next/navigation";
import { getAal2Admin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomersListReal, type CustomerRow } from "@/components/admin/customers-list-real";

export default async function AdminCustomersPage() {
  const supabase = await createClient();
  if (!(await getAal2Admin(supabase))) redirect("/admin/sign-in");
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, phone, status")
    .eq("role", "customer")
    .order("created_at", { ascending: false });
  if (profilesError) throw new Error("Customers could not be loaded.");

  const admin = createAdminClient();
  const { data: authList, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (authError) throw new Error("Customer identities could not be loaded.");
  const authById = new Map(authList.users.map((u) => [u.id, u]));

  const ids = (profiles ?? []).map((p) => p.id);
  const { data: orders, error: ordersError } = ids.length
    ? await supabase.from("orders").select("customer_id, total_amount, payment_status").in("customer_id", ids)
    : { data: [], error: null };
  if (ordersError) throw new Error("Customer orders could not be loaded.");

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
      lifetimeSpendCents: customerOrders.filter((order) => ["paid", "partially_refunded"].includes(order.payment_status)).reduce((sum, order) => sum + order.total_amount, 0),
    };
  });

  return <CustomersListReal customers={customers} />;
}
