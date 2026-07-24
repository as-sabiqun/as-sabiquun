import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { JobDetailDemo } from "@/components/vendor/job-detail-demo";
import { JobDetailReal, type ProofRow, type VendorOrderDetail } from "@/components/vendor/job-detail-real";

export default async function VendorJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isSupabaseConfigured) return <JobDetailDemo id={id} />;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect(`/login?next=/vendor-dashboard/jobs/${id}`);

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, reference, service_type, category_slug, quantity, participant_names, dedication, total_amount, status, created_at, customer_name, customer_phone, offerings(title)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const { data: offer } = await supabase
    .from("job_offers")
    .select("status, expires_at")
    .eq("order_id", id)
    .eq("vendor_id", userData.user.id)
    .maybeSingle();

  const isOffer = offer?.status === "offered" && order.status === "broadcasting";

  let proofs: ProofRow[] = [];
  if (order.status === "proof_submitted" || order.status === "completed") {
    const { data } = await supabase.from("proofs").select("id, storage_path, media_type").eq("order_id", id);
    proofs = await Promise.all(
      (data ?? []).map(async (p) => {
        const { data: signed } = await supabase.storage.from("proofs").createSignedUrl(p.storage_path, 3600);
        return { id: p.id, media_type: p.media_type, url: signed?.signedUrl ?? null };
      })
    );
  }

  return (
    <JobDetailReal
      order={order as unknown as VendorOrderDetail}
      vendorId={userData.user.id}
      isOffer={isOffer}
      offerExpiresAt={offer?.expires_at ?? null}
      proofs={proofs}
    />
  );
}
