import { createClient } from "@/lib/supabase/server";
import { VendorsListReal, type VendorRow } from "@/components/admin/vendors-list-real";

export default async function AdminVendorsPage() {
  const supabase = await createClient();
  const [{ data: profiles, error: profilesError }, { data: orders, error: ordersError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, contact_person, phone, country, city_address, vendor_type, services, status, vendor_onboarding_status, rating")
      .eq("role", "vendor")
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("assigned_vendor_id, fulfilment_status, delivery_status")
      .not("assigned_vendor_id", "is", null),
  ]);
  if (profilesError) throw new Error("Partners could not be loaded.");
  if (ordersError) throw new Error("Partner jobs could not be loaded.");

  const vendors: VendorRow[] = (profiles ?? []).map((p) => {
    const vendorOrders = (orders ?? []).filter((o) => o.assigned_vendor_id === p.id);
    return {
      ...p,
      jobsCompleted: vendorOrders.filter((o) => o.fulfilment_status === "verified" && o.delivery_status === "delivered").length,
      jobsActive: vendorOrders.filter((o) => ["assigned", "in_progress", "proof_submitted", "revision_required"].includes(o.fulfilment_status)).length,
    };
  });

  return <VendorsListReal vendors={vendors} />;
}
