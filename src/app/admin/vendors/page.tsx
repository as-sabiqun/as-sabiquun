import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { VendorsListDemo } from "@/components/admin/vendors-list-demo";
import { VendorsListReal, type VendorRow } from "@/components/admin/vendors-list-real";

export default async function AdminVendorsPage() {
  if (!isSupabaseConfigured) return <VendorsListDemo />;

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, phone, vendor_type, services, status")
    .eq("role", "vendor")
    .order("created_at", { ascending: false });

  const vendorIds = (profiles ?? []).map((p) => p.id);
  const { data: orders } = vendorIds.length
    ? await supabase.from("orders").select("assigned_vendor_id, status").in("assigned_vendor_id", vendorIds)
    : { data: [] };

  const vendors: VendorRow[] = (profiles ?? []).map((p) => {
    const vendorOrders = (orders ?? []).filter((o) => o.assigned_vendor_id === p.id);
    return {
      ...p,
      jobsCompleted: vendorOrders.filter((o) => o.status === "completed").length,
      jobsActive: vendorOrders.filter((o) => ["assigned", "in_progress", "proof_submitted"].includes(o.status)).length,
    };
  });

  return <VendorsListReal vendors={vendors} />;
}
