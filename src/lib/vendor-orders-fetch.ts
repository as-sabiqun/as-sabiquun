import type { SupabaseClient } from "@supabase/supabase-js";
import type { VendorJobRow } from "@/lib/vendor-orders-types";

// Offers intentionally select fewer columns than assigned orders — a vendor
// shouldn't see a customer's name/phone for a job they've only been offered,
// only once they've actually claimed it (assigned_vendor_id = them).
export async function fetchVendorJobs(supabase: SupabaseClient, vendorId: string): Promise<VendorJobRow[]> {
  const { data: offers } = await supabase
    .from("job_offers")
    .select(
      "id, expires_at, orders(id, reference, service_type, category_slug, quantity, participant_names, dedication, vendor_payout_amount, status, created_at, offerings(title))"
    )
    .eq("vendor_id", vendorId)
    .eq("status", "offered");

  const { data: assigned } = await supabase
    .from("orders")
    .select(
      "id, reference, service_type, category_slug, quantity, participant_names, dedication, vendor_payout_amount, status, created_at, customer_name, customer_phone, offerings(title)"
    )
    .eq("assigned_vendor_id", vendorId)
    .order("created_at", { ascending: false });

  const offerRows: VendorJobRow[] = ((offers ?? []) as unknown as Array<{
    id: string;
    expires_at: string;
    orders: { id: string; reference: string; service_type: string; category_slug: string; quantity: number; participant_names: string[]; dedication: string | null; vendor_payout_amount: number; status: VendorJobRow["status"]; created_at: string; offerings: { title: string } | null } | null;
  }>)
    .filter((o) => o.orders && o.orders.status === "broadcasting" && new Date(o.expires_at) > new Date())
    .map((o) => ({
      order_id: o.orders!.id,
      offer_id: o.id,
      isOffer: true,
      reference: o.orders!.reference,
      title: o.orders!.offerings?.title ?? (o.orders!.service_type === "korban" ? "Korban order" : "Wakaf contribution"),
      service_type: o.orders!.service_type,
      category_slug: o.orders!.category_slug,
      quantity: o.orders!.quantity,
      participant_names: o.orders!.participant_names,
      dedication: o.orders!.dedication,
      vendor_payout_amount: o.orders!.vendor_payout_amount,
      status: o.orders!.status,
      expires_at: o.expires_at,
      created_at: o.orders!.created_at,
    }));

  const assignedRows: VendorJobRow[] = ((assigned ?? []) as unknown as Array<{
    id: string;
    reference: string;
    service_type: string;
    category_slug: string;
    quantity: number;
    participant_names: string[];
    dedication: string | null;
    vendor_payout_amount: number;
    status: VendorJobRow["status"];
    created_at: string;
    customer_name: string;
    customer_phone: string;
    offerings: { title: string } | null;
  }>).map((o) => ({
    order_id: o.id,
    isOffer: false,
    reference: o.reference,
    title: o.offerings?.title ?? (o.service_type === "korban" ? "Korban order" : "Wakaf contribution"),
    service_type: o.service_type,
    category_slug: o.category_slug,
    quantity: o.quantity,
    participant_names: o.participant_names,
    dedication: o.dedication,
    vendor_payout_amount: o.vendor_payout_amount,
    status: o.status,
    created_at: o.created_at,
    customer_name: o.customer_name,
    customer_phone: o.customer_phone,
  }));

  return [...offerRows, ...assignedRows];
}
