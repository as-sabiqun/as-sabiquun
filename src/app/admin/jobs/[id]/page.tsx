import { notFound } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { JobDetailDemo } from "@/components/admin/job-detail-demo";
import { JobDetailReal, type AdminOrderDetail, type JobOfferRow, type ProofRow } from "@/components/admin/job-detail-real";

export default async function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isSupabaseConfigured) return <JobDetailDemo id={id} />;

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, reference, service_type, category_slug, quantity, participant_names, dedication, customer_name, customer_phone, total_amount, status, created_at, offerings(title), assigned_vendor:profiles!orders_assigned_vendor_id_fkey(id, display_name, phone)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

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
  if (order.status === "proof_submitted" || order.status === "completed") {
    const { data } = await supabase.from("proofs").select("id, storage_path, media_type, caption").eq("order_id", id);
    proofs = await Promise.all(
      (data ?? []).map(async (p) => {
        const { data: signed } = await supabase.storage.from("proofs").createSignedUrl(p.storage_path, 3600);
        return { id: p.id, media_type: p.media_type, caption: p.caption, url: signed?.signedUrl ?? null };
      })
    );
  }

  return <JobDetailReal order={order as unknown as AdminOrderDetail} offers={offers} proofs={proofs} />;
}
