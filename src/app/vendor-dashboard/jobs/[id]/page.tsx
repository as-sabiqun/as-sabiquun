import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JobDetailReal, type ProofRow, type VendorOrderDetail } from "@/components/vendor/job-detail-real";

export default async function VendorJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect(`/partner-login?next=/vendor-dashboard/jobs/${id}`);

  const { data: assignedOrder, error: assignedError } = await supabase
    .from("vendor_assigned_orders")
    .select(
      "id, reference, service_type, category_slug, quantity, participant_names, dedication, vendor_payout_amount, payment_status, fulfilment_status, delivery_status, settlement_status, status, created_at, customer_name, customer_phone, admin_verification_notes, completion_deadline, beneficiary_country, beneficiary_state, beneficiary_village, partner_organisation, beneficiary_names, dedication_arabic, dedication_remarks, offering_title, offering_detail"
    )
    .eq("id", id)
    .maybeSingle();
  if (assignedError) throw new Error("The assigned job could not be loaded.");

  const { data: offeredOrder, error: offeredError } = assignedOrder ? { data: null, error: null } : await supabase
    .from("vendor_job_offers")
    .select("order_id, reference, service_type, category_slug, quantity, vendor_payout_amount, payment_status, fulfilment_status, delivery_status, settlement_status, status, created_at, offering_title, offering_detail, completion_deadline, beneficiary_country, beneficiary_state, beneficiary_village, partner_organisation, offer_status, expires_at")
    .eq("order_id", id)
    .eq("offer_status", "offered")
    .eq("fulfilment_status", "broadcasting")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (offeredError) throw new Error("The job offer could not be loaded.");

  if (!assignedOrder && !offeredOrder) notFound();

  const isOffer = !assignedOrder;
  const order = (assignedOrder ?? {
    ...offeredOrder,
    id: offeredOrder!.order_id,
    participant_names: [],
    dedication: null,
  }) as unknown as VendorOrderDetail;

  let proofs: ProofRow[] = [];
  if (!isOffer && ["proof_submitted", "revision_required", "verified"].includes(order.fulfilment_status)) {
    const { data, error } = await supabase.from("proofs").select("id, storage_path, media_type, category").eq("order_id", id);
    if (error) throw new Error("Submitted evidence could not be loaded.");
    proofs = await Promise.all(
      (data ?? []).map(async (p) => {
        const { data: signed } = await supabase.storage.from("proofs").createSignedUrl(p.storage_path, 3600);
        return { id: p.id, media_type: p.media_type, category: p.category, url: signed?.signedUrl ?? null };
      })
    );
  }

  return (
    <JobDetailReal
      order={order as unknown as VendorOrderDetail}
      vendorId={userData.user.id}
      isOffer={isOffer}
      offerExpiresAt={offeredOrder?.expires_at ?? null}
      proofs={proofs}
    />
  );
}
