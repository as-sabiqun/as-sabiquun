import type { SupabaseClient } from "@supabase/supabase-js";
import type { VendorJobRow } from "@/lib/vendor-orders-types";

interface VendorOfferViewRow {
  offer_id: string;
  order_id: string;
  expires_at: string;
  reference: string;
  offering_title: string;
  service_type: string;
  category_slug: string;
  quantity: number;
  vendor_payout_amount: number;
  payment_status: VendorJobRow["payment_status"];
  fulfilment_status: VendorJobRow["fulfilment_status"];
  delivery_status: VendorJobRow["delivery_status"];
  settlement_status: VendorJobRow["settlement_status"];
  created_at: string;
}

interface VendorAssignedViewRow {
  id: string;
  reference: string;
  offering_title: string;
  service_type: string;
  category_slug: string;
  quantity: number;
  participant_names: string[];
  dedication: string | null;
  vendor_payout_amount: number;
  payment_status: VendorJobRow["payment_status"];
  fulfilment_status: VendorJobRow["fulfilment_status"];
  delivery_status: VendorJobRow["delivery_status"];
  settlement_status: VendorJobRow["settlement_status"];
  accepted_at: string | null;
  created_at: string;
  customer_name: string;
  customer_phone: string;
}

export async function fetchVendorJobs(supabase: SupabaseClient): Promise<VendorJobRow[]> {
  const [{ data: offers, error: offersError }, { data: assigned, error: assignedError }] = await Promise.all([
    supabase
      .from("vendor_job_offers")
      .select("offer_id, order_id, expires_at, reference, offering_title, service_type, category_slug, quantity, vendor_payout_amount, payment_status, fulfilment_status, delivery_status, settlement_status, created_at")
      .eq("offer_status", "offered")
      .eq("fulfilment_status", "broadcasting")
      .gt("expires_at", new Date().toISOString()),
    supabase
      .from("vendor_assigned_orders")
      .select("id, reference, offering_title, service_type, category_slug, quantity, participant_names, dedication, vendor_payout_amount, payment_status, fulfilment_status, delivery_status, settlement_status, accepted_at, created_at, customer_name, customer_phone")
      .order("created_at", { ascending: false }),
  ]);
  if (offersError || assignedError) throw new Error("Vendor jobs could not be loaded.");

  const offerRows: VendorJobRow[] = ((offers ?? []) as VendorOfferViewRow[]).map((offer) => ({
    order_id: offer.order_id,
    offer_id: offer.offer_id,
    isOffer: true,
    reference: offer.reference,
    title: offer.offering_title,
    service_type: offer.service_type,
    category_slug: offer.category_slug,
    quantity: offer.quantity,
    participant_names: [],
    dedication: null,
    vendor_payout_amount: offer.vendor_payout_amount,
    payment_status: offer.payment_status,
    fulfilment_status: offer.fulfilment_status,
    delivery_status: offer.delivery_status,
    settlement_status: offer.settlement_status,
    expires_at: offer.expires_at,
    created_at: offer.created_at,
  }));

  const assignedRows: VendorJobRow[] = ((assigned ?? []) as VendorAssignedViewRow[]).map((order) => ({
    order_id: order.id,
    isOffer: false,
    reference: order.reference,
    title: order.offering_title,
    service_type: order.service_type,
    category_slug: order.category_slug,
    quantity: order.quantity,
    participant_names: order.participant_names,
    dedication: order.dedication,
    vendor_payout_amount: order.vendor_payout_amount,
    payment_status: order.payment_status,
    fulfilment_status: order.fulfilment_status,
    delivery_status: order.delivery_status,
    settlement_status: order.settlement_status,
    accepted_at: order.accepted_at,
    created_at: order.created_at,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
  }));

  return [...offerRows, ...assignedRows];
}
