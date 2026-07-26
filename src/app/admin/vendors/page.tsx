import { createClient } from "@/lib/supabase/server";
import { VendorsListReal, type VendorRow } from "@/components/admin/vendors-list-real";

export default async function AdminVendorsPage() {
  const supabase = await createClient();
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, phone, vendor_type, services, status, vendor_onboarding_status")
    .eq("role", "vendor")
    .order("created_at", { ascending: false });

  const vendorIds = (profiles ?? []).map((p) => p.id);
  if (profilesError) throw new Error("Partners could not be loaded.");
  const { data: orders, error: ordersError } = vendorIds.length
    ? await supabase.from("orders").select("assigned_vendor_id, fulfilment_status, delivery_status").in("assigned_vendor_id", vendorIds)
    : { data: [], error: null };
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
