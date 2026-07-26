import { redirect } from "next/navigation";
import { CustomersListReal, type CustomerRow } from "@/components/admin/customers-list-real";
import { getAal2Admin } from "@/lib/auth";
import { customerOrderMetrics, type CustomerOrderInput } from "@/lib/customer-directory";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CustomerOrderRecord = CustomerOrderInput & {
  customer_id: string;
  created_at: string;
  updated_at: string;
};

export default async function AdminCustomersPage() {
  const supabase = await createClient();
  if (!(await getAal2Admin(supabase))) redirect("/admin/sign-in");
  const admin = createAdminClient();
  const [
    { data: profiles, error: profilesError },
    { data: authList, error: authError },
    { data: orders, error: ordersError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, phone, status, telegram_linked_at, created_at")
      .eq("role", "customer")
      .order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    supabase
      .from("orders")
      .select("customer_id, total_amount, payment_provider, payment_status, fulfilment_status, delivery_status, created_at, updated_at, payment_transactions(transaction_type, amount, status)"),
  ]);
  if (profilesError) throw new Error("Customers could not be loaded.");
  if (authError) throw new Error("Customer identities could not be loaded.");
  if (ordersError) throw new Error("Customer orders could not be loaded.");

  const authById = new Map(authList.users.map((user) => [user.id, user]));
  const ordersByCustomer = new Map<string, CustomerOrderRecord[]>();
  for (const order of (orders ?? []) as CustomerOrderRecord[]) {
    const customerOrders = ordersByCustomer.get(order.customer_id) ?? [];
    customerOrders.push(order);
    ordersByCustomer.set(order.customer_id, customerOrders);
  }

  const customers: CustomerRow[] = (profiles ?? []).map((profile) => {
    const authUser = authById.get(profile.id);
    const customerOrders = ordersByCustomer.get(profile.id) ?? [];
    return {
      id: profile.id,
      display_name: profile.display_name,
      email: authUser?.email ?? "—",
      phone: profile.phone,
      verified: Boolean(authUser?.email_confirmed_at),
      telegramLinked: Boolean(profile.telegram_linked_at),
      status: profile.status as "active" | "suspended",
      createdAt: profile.created_at,
      latestOrderAt: customerOrders.reduce<string | null>((latest, order) => !latest || order.updated_at > latest ? order.updated_at : latest, null),
      ordersCount: customerOrders.length,
      ...customerOrderMetrics(customerOrders),
    };
  });

  return <CustomersListReal customers={customers} />;
}
