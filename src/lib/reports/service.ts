import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAal2Admin, isCustomerAccount } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/supabase/server";
import { safeReportLink, type CompletionReportSource } from "./model";
import { renderCompletionReport } from "./pdf";
import { prepareCompletionReportsBeforeDelivery } from "./workflow";

const REPORT_BUCKET = "completion-reports";
const MAX_REPORT_BYTES = 20 * 1024 * 1024;
const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024;

interface OrderRecord {
  id: string;
  reference: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  service_type: string;
  category_slug: string;
  participant_names: string[];
  dedication: string | null;
  total_amount: number;
  vendor_payout_amount: number;
  currency: string;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  assigned_vendor_id: string | null;
  beneficiary_country: string | null;
  beneficiary_state: string | null;
  beneficiary_village: string | null;
  partner_organisation: string | null;
  beneficiary_names: string[];
  dedication_arabic: string | null;
  dedication_remarks: string | null;
  offering_title: string;
}

interface SubmissionRecord {
  id: string;
  vendor_id: string;
  version: number;
  project_country: string;
  project_state: string;
  project_village: string;
  project_address: string;
  project_lat: number;
  project_lng: number;
  project_maps_link: string | null;
  vendor_remarks: string;
  submitted_at: string;
  reviewed_by: string;
  reviewed_at: string;
  review_notes: string | null;
}

interface ProfileRecord {
  display_name: string;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  swift_code: string | null;
}

interface ProofRecord {
  id: string;
  category: string;
  media_type: "photo" | "video";
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string;
  created_at: string;
}

export class ReportGenerationError extends Error {
  constructor(message: string, readonly code: "forbidden" | "not_found" | "invalid_state" | "storage" | "database") {
    super(message);
  }
}

function one<T>(relation: T | T[] | null): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function elapsed(from: string, to: string) {
  const hours = Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 3_600_000));
  const days = Math.floor(hours / 24);
  return days ? `${days} day${days === 1 ? "" : "s"} ${hours % 24} hour${hours % 24 === 1 ? "" : "s"}` : `${hours} hour${hours === 1 ? "" : "s"}`;
}

async function loadSource(admin: ReturnType<typeof createAdminClient>, orderId: string, siteUrl: string): Promise<CompletionReportSource> {
  const generatedAt = new Date().toISOString();
  const { data: rawOrder, error: orderError } = await admin
    .from("orders")
    .select(`id, reference, customer_id, customer_name, customer_phone, customer_email, service_type, category_slug,
      participant_names, dedication, total_amount, vendor_payout_amount, currency, created_at, accepted_at, completed_at,
      assigned_vendor_id, beneficiary_country, beneficiary_state, beneficiary_village, partner_organisation,
      beneficiary_names, dedication_arabic, dedication_remarks, offering_title`)
    .eq("id", orderId)
    .single();
  if (orderError || !rawOrder) throw new ReportGenerationError("Order not found.", "not_found");
  const order = rawOrder as unknown as OrderRecord;

  const { data: rawSubmission, error: submissionError } = await admin
    .from("completion_submissions")
    .select("id, vendor_id, version, project_country, project_state, project_village, project_address, project_lat, project_lng, project_maps_link, vendor_remarks, submitted_at, reviewed_by, reviewed_at, review_notes")
    .eq("order_id", orderId)
    .eq("status", "approved")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (submissionError) throw new ReportGenerationError("The approved submission could not be loaded.", "database");
  if (!rawSubmission) throw new ReportGenerationError("An approved vendor submission is required before reports can be generated.", "invalid_state");
  const submission = rawSubmission as SubmissionRecord;

  const [{ data: rawVendor, error: vendorError }, { data: rawReviewer, error: reviewerError }, proofsResult, notificationResult, paymentsResult, auditResult] = await Promise.all([
    admin.from("profiles").select("display_name, bank_name, bank_account_name, bank_account_number, swift_code").eq("id", submission.vendor_id).single(),
    admin.from("profiles").select("display_name, bank_name, bank_account_name, bank_account_number, swift_code").eq("id", submission.reviewed_by).single(),
    admin.from("proofs").select("id, category, media_type, mime_type, size_bytes, storage_path, created_at").eq("submission_id", submission.id).order("evidence_slot"),
    admin.from("notification_deliveries").select("channel, status, attempted_at, sent_at, delivered_at, error_message").eq("order_id", orderId).order("created_at"),
    admin.from("vendor_payments").select("amount, payment_date, method, reference").eq("order_id", orderId).order("payment_date"),
    admin.from("order_events").select("event_type, actor_role, created_at").eq("order_id", orderId).order("created_at"),
  ]);
  if (vendorError || !rawVendor || reviewerError || !rawReviewer || proofsResult.error || notificationResult.error || paymentsResult.error || auditResult.error) {
    throw new ReportGenerationError("The completion record could not be loaded.", "database");
  }
  const vendor = rawVendor as ProfileRecord;
  const reviewer = rawReviewer as ProfileRecord;
  const proofs = (proofsResult.data ?? []) as ProofRecord[];
  const packageTitle = order.offering_title;
  const portalUrl = `${siteUrl}/dashboard/orders/${encodeURIComponent(order.reference)}`;

  return {
    submissionId: submission.id,
    generatedAt,
    projectPortalUrl: portalUrl,
    receiptUrl: `${siteUrl}/receipts/${encodeURIComponent(order.reference)}`,
    job: {
      id: order.id,
      reference: order.reference,
      serviceType: order.service_type === "wakaf" ? `Wakaf - ${order.category_slug}` : "Korban",
      packagePurchased: packageTitle,
      createdAt: order.created_at,
      assignedAt: order.accepted_at,
      completedAt: order.completed_at,
      totalProcessingTime: elapsed(order.created_at, order.completed_at ?? generatedAt),
      packagePrice: order.total_amount,
      vendorCost: order.vendor_payout_amount,
      currency: "SGD",
    },
    customer: {
      name: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email ?? "Not recorded",
      invoiceNumber: order.reference,
    },
    beneficiary: {
      country: order.beneficiary_country,
      state: order.beneficiary_state,
      village: order.beneficiary_village,
      partnerOrganisation: order.partner_organisation,
      names: order.beneficiary_names ?? [],
    },
    dedication: {
      names: order.participant_names?.length ? order.participant_names : order.dedication ? [order.dedication] : [],
      arabicSpelling: order.dedication_arabic,
      remarks: order.dedication_remarks,
    },
    vendor: {
      name: vendor.display_name,
      id: submission.vendor_id,
      acceptedAt: order.accepted_at,
      submittedBy: vendor.display_name,
      bankDetails: {
        bankName: vendor.bank_name,
        accountName: vendor.bank_account_name,
        accountNumber: vendor.bank_account_number,
        swiftCode: vendor.swift_code,
      },
    },
    location: {
      country: submission.project_country,
      state: submission.project_state,
      village: submission.project_village,
      address: submission.project_address,
      latitude: Number(submission.project_lat),
      longitude: Number(submission.project_lng),
      mapsLink: safeReportLink(submission.project_maps_link),
    },
    evidence: proofs.map((proof) => ({
      id: proof.id,
      category: proof.category,
      mediaType: proof.media_type,
      mimeType: proof.mime_type,
      sizeBytes: proof.size_bytes,
      storagePath: proof.storage_path,
      createdAt: proof.created_at,
      portalUrl: `${portalUrl}#evidence`,
    })),
    vendorRemarks: submission.vendor_remarks,
    verification: {
      verifiedBy: reviewer.display_name,
      verifiedAt: submission.reviewed_at,
      notes: submission.review_notes,
      status: "approved",
      submissionVersion: submission.version,
    },
    notifications: (notificationResult.data ?? []).map((item) => ({
      channel: item.channel as "email" | "telegram",
      status: item.status,
      attemptedAt: item.attempted_at,
      sentAt: item.sent_at,
      deliveredAt: item.delivered_at,
      error: item.error_message,
    })),
    payments: (paymentsResult.data ?? []).map((payment) => ({
      amount: payment.amount,
      date: payment.payment_date,
      method: payment.method,
      reference: payment.reference,
    })),
    audit: (auditResult.data ?? []).map((event) => ({
      eventType: event.event_type,
      actorRole: event.actor_role,
      createdAt: event.created_at,
    })),
  };
}

async function loadThumbnails(admin: ReturnType<typeof createAdminClient>, source: CompletionReportSource) {
  const phases = ["before_photo", "during_photo", "after_photo"];
  const selected = phases.map((phase) => source.evidence.find((proof) => proof.category === phase && ["image/jpeg", "image/png"].includes(proof.mimeType ?? "") && (proof.sizeBytes ?? MAX_THUMBNAIL_BYTES + 1) <= MAX_THUMBNAIL_BYTES)).filter(Boolean) as CompletionReportSource["evidence"];
  const entries = await Promise.all(selected.map(async (proof) => {
    const { data, error } = await admin.storage.from("proofs").download(proof.storagePath);
    return error || !data ? null : [proof.id, Buffer.from(await data.arrayBuffer())] as const;
  }));
  const thumbnails: Record<string, Buffer> = {};
  for (const entry of entries) if (entry) thumbnails[entry[0]] = entry[1];
  return thumbnails;
}

async function latestVersion(admin: ReturnType<typeof createAdminClient>, orderId: string, kind: "customer" | "internal") {
  const { data, error } = await admin.from("completion_reports").select("version").eq("order_id", orderId).eq("kind", kind).order("version", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new ReportGenerationError("The report version could not be read.", "database");
  return (data?.version ?? 0) + 1;
}

async function existingReport(admin: ReturnType<typeof createAdminClient>, submissionId: string, kind: "customer" | "internal") {
  const { data, error } = await admin.from("completion_reports").select("id, version").eq("submission_id", submissionId).eq("kind", kind).order("version", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new ReportGenerationError("The report history could not be read.", "database");
  return data;
}

async function storeReport(admin: ReturnType<typeof createAdminClient>, source: CompletionReportSource, kind: "customer" | "internal", generatedBy: string, thumbnails: Record<string, Buffer>, regenerate: boolean) {
  const existing = regenerate ? null : await existingReport(admin, source.submissionId, kind);
  if (existing) return { ...existing, created: false };

  const version = await latestVersion(admin, source.job.id, kind);
  const pdf = await renderCompletionReport(kind, source, thumbnails);
  if (pdf.byteLength > MAX_REPORT_BYTES) throw new ReportGenerationError("The generated report exceeds the 20 MB storage limit.", "storage");
  const checksum = createHash("sha256").update(pdf).digest("hex");
  const storagePath = `${source.job.id}/${kind}-v${version}-${source.submissionId}.pdf`;
  const { error: uploadError } = await admin.storage.from(REPORT_BUCKET).upload(storagePath, pdf, { contentType: "application/pdf", upsert: false });
  if (uploadError) throw new ReportGenerationError("The generated report could not be stored.", "storage");

  const { data, error } = await admin.from("completion_reports").insert({
    order_id: source.job.id,
    submission_id: source.submissionId,
    kind,
    version,
    storage_path: storagePath,
    checksum,
    generated_by: generatedBy,
  }).select("id, version").single();
  if (error || !data) {
    await admin.storage.from(REPORT_BUCKET).remove([storagePath]);
    throw new ReportGenerationError("The generated report could not be registered.", "database");
  }
  return { ...data, created: true };
}

export async function generateCompletionReportsForAdmin(sessionClient: SupabaseClient, orderId: string, regenerateInternal = false) {
  const actor = await getAal2Admin(sessionClient);
  if (!actor) throw new ReportGenerationError("AAL2 admin access is required.", "forbidden");

  const admin = createAdminClient();
  const siteUrl = await getSiteUrl();
  const source = await loadSource(admin, orderId, siteUrl);
  const thumbnails = await loadThumbnails(admin, source);
  return prepareCompletionReportsBeforeDelivery({
    prepareCustomer: () => storeReport(admin, source, "customer", actor.user.id, thumbnails, false),
    prepareInternal: async () => {
      const internalSource = await loadSource(admin, orderId, siteUrl);
      return storeReport(admin, internalSource, "internal", actor.user.id, thumbnails, regenerateInternal);
    },
    queueDelivery: async (customer) => {
      const { error } = await admin.rpc("queue_order_notifications", { p_order_id: orderId, p_report_id: customer.id });
      if (error) throw new ReportGenerationError("The completion reports were saved, but delivery could not be queued.", "database");
    },
  });
}

export async function downloadCompletionReportForViewer(sessionClient: SupabaseClient, reportId: string) {
  const { data: authData } = await sessionClient.auth.getUser();
  if (!authData.user) throw new ReportGenerationError("Sign in to access this report.", "forbidden");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("completion_reports")
    .select("kind, storage_path, orders!inner(customer_id, reference)")
    .eq("id", reportId)
    .maybeSingle();
  if (error || !data) throw new ReportGenerationError("Report not found.", "not_found");
  const order = one(data.orders as { customer_id: string; reference: string } | Array<{ customer_id: string; reference: string }> | null);
  if (!order) throw new ReportGenerationError("Report not found.", "not_found");

  const aal2Admin = await getAal2Admin(sessionClient);
  const customerProfile = aal2Admin ? null : await getProfile(sessionClient, authData.user.id);
  const ownsCustomerReport = data.kind === "customer"
    && order.customer_id === authData.user.id
    && await isCustomerAccount(sessionClient, authData.user, customerProfile);
  if (!aal2Admin && !ownsCustomerReport) throw new ReportGenerationError("Report not found.", "not_found");

  const { data: file, error: downloadError } = await admin.storage.from(REPORT_BUCKET).download(data.storage_path);
  if (downloadError || !file) throw new ReportGenerationError("The report file is unavailable.", "storage");
  return {
    bytes: Buffer.from(await file.arrayBuffer()),
    filename: `${order.reference}-${data.kind}-completion-report.pdf`.replace(/[^a-zA-Z0-9._-]/g, "-"),
  };
}
