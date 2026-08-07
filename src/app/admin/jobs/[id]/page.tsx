import { notFound } from "next/navigation";
import {
  JobDetailReal,
  type AdminOrderDetail,
  type CompletionReportRow,
  type CompletionSubmissionRow,
  type JobOfferRow,
  type NotificationRow,
  type OrderEventRow,
  type PaymentRow,
  type ProofRow,
  type ProviderTransactionRow,
} from "@/components/admin/job-detail-real";
import { createClient } from "@/lib/supabase/server";

export default async function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(`id, reference, service_type, category_slug, quantity, participant_names, dedication, notes,
      unit_amount, total_amount, commission_amount, vendor_payout_amount, currency, offering_title, offering_detail, status,
      payment_provider, payment_status, fulfilment_status, delivery_status, settlement_status, payment_reference, entry_source,
      created_at, updated_at, customer_id, customer_name, customer_phone, customer_email,
      beneficiary_country, beneficiary_state, beneficiary_village, partner_organisation, beneficiary_names,
      dedication_arabic, dedication_remarks, project_country, project_state, project_village,
      project_address, project_lat, project_lng, project_maps_link, vendor_remarks,
      broadcast_started_at, broadcast_expires_at, accepted_at, proof_submitted_at, completed_at, closed_at, completion_deadline,
      refund_fulfilment_resolution, refund_resolution_reason, refund_resolved_at,
      admin_verified_by, admin_verified_at, admin_verification_notes, admin_verification_status,
      offerings(title), assigned_vendor:profiles!orders_assigned_vendor_id_fkey(id, display_name, phone)`)
    .eq("id", id)
    .maybeSingle();

  if (orderError) throw new Error("The operational record could not be loaded.");
  if (!order) notFound();

  const [offersResult, submissionsResult, proofsResult, notificationsResult, reportsResult, transactionsResult, paymentsResult, eventsResult, verifierResult] = await Promise.all([
    supabase.from("job_offers").select("id, status, offered_at, expires_at, vendor:profiles!job_offers_vendor_id_fkey(id, display_name)").eq("order_id", id).order("offered_at", { ascending: false }),
    supabase.from("completion_submissions").select(`id, version, status, project_country, project_state, project_village, project_address,
      project_lat, project_lng, project_maps_link, vendor_remarks, submitted_at, reviewed_at, review_notes, review_checklist,
      vendor:profiles!completion_submissions_vendor_id_fkey(id, display_name), reviewer:profiles!completion_submissions_reviewed_by_fkey(display_name)`)
      .eq("order_id", id).order("version", { ascending: false }),
    supabase.from("proofs").select("id, submission_id, storage_path, media_type, category, evidence_slot, mime_type, size_bytes, created_at").eq("order_id", id).order("created_at"),
    supabase.from("notification_deliveries").select("id, report_id, channel, recipient, attempt, status, provider_message_id, error_code, error_message, next_retry_at, attempted_at, sent_at, delivered_at, created_at, updated_at").eq("order_id", id).order("created_at", { ascending: false }),
    supabase.from("completion_reports").select("id, submission_id, kind, version, storage_path, checksum, generated_at").eq("order_id", id).order("generated_at", { ascending: false }),
    supabase.from("payment_transactions").select("id, provider, transaction_type, provider_request_id, provider_payment_id, amount, currency, status, reason, provider_event_at, created_at").eq("order_id", id).order("created_at", { ascending: false }),
    supabase.from("vendor_payments").select("id, amount, currency, payment_date, method, reference, notes, entry_type, reverses_payment_id, created_at").eq("order_id", id).order("created_at", { ascending: false }),
    supabase.from("order_events").select("id, actor_id, actor_role, event_type, source, previous_state, new_state, metadata, created_at").eq("order_id", id).order("created_at", { ascending: true }).order("id", { ascending: true }),
    order.admin_verified_by ? supabase.from("profiles").select("display_name").eq("id", order.admin_verified_by).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const { data: signedProofUrls, error: signedProofsError } = await supabase.storage
    .from("proofs")
    .createSignedUrls((proofsResult.data ?? []).map((proof) => proof.storage_path), 3600);
  const proofs = (proofsResult.data ?? []).map((proof, index) => ({
    ...proof,
    url: signedProofUrls?.[index]?.signedUrl ?? null,
  })) as ProofRow[];

  const detail: AdminOrderDetail = {
    ...order,
    assigned_vendor: order.assigned_vendor as unknown as AdminOrderDetail["assigned_vendor"],
    admin_verifier_name: verifierResult.data?.display_name ?? null,
  } as unknown as AdminOrderDetail;
  const warnings = [offersResult, submissionsResult, proofsResult, notificationsResult, reportsResult, transactionsResult, paymentsResult, eventsResult]
    .flatMap((result) => result.error ? [result.error.message] : [])
    .concat(signedProofsError ? [signedProofsError.message] : []);

  return (
    <JobDetailReal
      order={detail}
      offers={(offersResult.data ?? []) as unknown as JobOfferRow[]}
      submissions={(submissionsResult.data ?? []) as unknown as CompletionSubmissionRow[]}
      proofs={proofs}
      notifications={(notificationsResult.data ?? []) as NotificationRow[]}
      reports={(reportsResult.data ?? []) as CompletionReportRow[]}
      transactions={(transactionsResult.data ?? []) as ProviderTransactionRow[]}
      payments={(paymentsResult.data ?? []) as PaymentRow[]}
      events={(eventsResult.data ?? []) as unknown as OrderEventRow[]}
      warnings={warnings}
    />
  );
}
