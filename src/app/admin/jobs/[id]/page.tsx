import { notFound } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { JobDetailDemo } from "@/components/admin/job-detail-demo";
import { JobDetailReal, type AdminOrderDetail, type JobOfferRow, type PaymentSummary, type ProofRow } from "@/components/admin/job-detail-real";

export default async function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isSupabaseConfigured) return <JobDetailDemo id={id} />;

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, reference, service_type, category_slug, quantity, participant_names, dedication, total_amount,
       vendor_payout_amount, status, created_at, customer_id, customer_name, customer_phone,
       beneficiary_country, beneficiary_state, beneficiary_village, partner_organisation, beneficiary_names,
       dedication_arabic, dedication_remarks,
       project_country, project_state, project_village, project_address, project_lat, project_lng, project_maps_link,
       vendor_remarks, accepted_at, proof_submitted_at, completed_at,
       admin_verified_by, admin_verified_at, admin_verification_notes, admin_verification_status,
       email_sent_at, telegram_sent_at,
       offerings(title), assigned_vendor:profiles!orders_assigned_vendor_id_fkey(id, display_name, phone)`
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const admin = createAdminClient();
  const { data: customerAuth } = await admin.auth.admin.getUserById(order.customer_id);

  let adminVerifierName: string | null = null;
  if (order.admin_verified_by) {
    const { data: verifier } = await supabase.from("profiles").select("display_name").eq("id", order.admin_verified_by).maybeSingle();
    adminVerifierName = verifier?.display_name ?? null;
  }

  let offers: JobOfferRow[] = [];
  if (order.status === "broadcasting") {
    const { data } = await supabase
      .from("job_offers")
      .select("id, status, expires_at, vendor:profiles!job_offers_vendor_id_fkey(id, display_name)")
      .eq("order_id", id)
      .order("offered_at", { ascending: true });
    offers = (data ?? []) as unknown as JobOfferRow[];
  }

  let proofs: ProofRow[] = [];
  if (["proof_submitted", "completed", "revision_required"].includes(order.status)) {
    const { data } = await supabase.from("proofs").select("id, storage_path, media_type, category").eq("order_id", id);
    proofs = await Promise.all(
      (data ?? []).map(async (p) => {
        const { data: signed } = await supabase.storage.from("proofs").createSignedUrl(p.storage_path, 3600);
        return { id: p.id, media_type: p.media_type, category: p.category, url: signed?.signedUrl ?? null };
      })
    );
  }

  const { data: paymentRows } = await supabase.from("vendor_payments").select("amount").eq("order_id", id);
  const payments: PaymentSummary = {
    payable: order.vendor_payout_amount,
    paid: (paymentRows ?? []).reduce((sum, p) => sum + p.amount, 0),
  };

  const detail: AdminOrderDetail = {
    ...order,
    customer_email: customerAuth.user?.email ?? "—",
    admin_verifier_name: adminVerifierName,
  } as unknown as AdminOrderDetail;

  return <JobDetailReal order={detail} offers={offers} proofs={proofs} payments={payments} />;
}
