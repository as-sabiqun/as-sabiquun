"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAal2AdminAtLeast } from "@/lib/auth";
import { dollarsToCents, isContactNumber } from "@/lib/checkout-validation";
import { generateCompletionReportsForAdmin, ReportGenerationError } from "@/lib/reports/service";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ManualJobState = { error: string } | undefined;

async function getAdminClient() {
  const supabase = await createClient();
  const admin = await getAal2AdminAtLeast(supabase, "operations");
  return admin ? { supabase, user: admin.user } : null;
}

async function getFinanceAdminClient() {
  const supabase = await createClient();
  const admin = await getAal2AdminAtLeast(supabase, "administrator");
  return admin ? { supabase, user: admin.user } : null;
}

export async function createManualJobAction(_previous: ManualJobState, formData: FormData): Promise<ManualJobState> {
  const offeringId = String(formData.get("offeringId") ?? "").trim();
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();
  const paymentReference = String(formData.get("paymentReference") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  const amount = String(formData.get("amount") ?? "").trim();
  const totalAmount = amount ? dollarsToCents(Number(amount)) : null;
  const participantNames = String(formData.get("participantNames") ?? "").split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
  const deadline = String(formData.get("completionDeadline") ?? "").trim();

  if (!UUID.test(offeringId) || !customerName || !isContactNumber(customerPhone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) || !paymentReference) {
    return { error: "Complete the customer, service, and payment details." };
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 7 || (amount && totalAmount === null)) {
    return { error: "Check the quantity or contribution amount." };
  }
  if (deadline && Number.isNaN(Date.parse(deadline))) return { error: "Enter a valid target completion date." };

  const admin = await getAdminClient();
  if (!admin) return { error: "Operations-admin access is required." };
  const { data, error } = await admin.supabase.rpc("create_admin_manual_order", {
    p_offering_id: offeringId,
    p_quantity: quantity,
    p_total_amount: totalAmount,
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_customer_email: customerEmail,
    p_participant_names: participantNames,
    p_dedication: String(formData.get("dedication") ?? "").trim() || null,
    p_payment_reference: paymentReference,
    p_payment_method: String(formData.get("paymentMethod") ?? "").trim() || null,
    p_notes: String(formData.get("notes") ?? "").trim() || null,
    p_beneficiary_country: String(formData.get("beneficiaryCountry") ?? "").trim() || null,
    p_completion_deadline: deadline ? new Date(`${deadline}T12:00:00`).toISOString() : null,
  });
  const job = Array.isArray(data) ? data[0] : null;
  if (error || !job?.id) return { error: error?.message ?? "The manual job could not be created." };
  revalidatePath("/admin");
  revalidatePath("/admin/jobs");
  redirect(`/admin/jobs/${job.id}`);
}

// These call the SECURITY DEFINER RPC functions from the migrations using the
// caller's own session (not the service-role client) — the functions check
// is_admin()/auth.uid() themselves, so this stays correctly scoped to
// whichever admin is actually signed in.

export async function broadcastOrderAction(orderId: string, deadline?: string): Promise<{ ok: boolean; error?: string; offered?: number }> {
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: "Admin access required." };
  const { supabase } = admin;
  const { data, error } = await supabase.rpc("broadcast_order", { p_order_id: orderId, p_deadline: deadline || null });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/jobs");
  revalidatePath(`/admin/jobs/${orderId}`);
  return { ok: true, offered: data as number };
}

export async function reviewProofAction(orderId: string, approved: boolean, notes: string, checklist: string[]): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: "Admin access required." };
  const { supabase } = admin;
  const { data, error } = await supabase.rpc("review_proof", {
    p_order_id: orderId,
    p_approved: approved,
    p_notes: notes || null,
    p_checklist: Object.fromEntries(checklist.map((item) => [item, true])),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/jobs");
  revalidatePath(`/admin/jobs/${orderId}`);
  return { ok: Boolean(data) };
}

export async function generateCompletionReportsAction(orderId: string, regenerateInternal = false): Promise<{ ok: boolean; error?: string }> {
  if (!orderId) return { ok: false, error: "A job is required." };
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: "A verified administrator session is required." };
  try {
    await generateCompletionReportsForAdmin(admin.supabase, orderId, regenerateInternal);
    revalidatePath("/admin");
    revalidatePath("/admin/jobs");
    revalidatePath(`/admin/jobs/${orderId}`);
    return { ok: true };
  } catch (error) {
    revalidatePath(`/admin/jobs/${orderId}`);
    return { ok: false, error: error instanceof ReportGenerationError ? error.message : "The completion reports could not be generated." };
  }
}

export async function retryNotificationDeliveryAction(orderId: string, deliveryId: string): Promise<{ ok: boolean; error?: string }> {
  if (!UUID.test(orderId) || !UUID.test(deliveryId)) return { ok: false, error: "A valid notification delivery is required." };
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: "A verified administrator session is required." };
  const { error } = await admin.supabase.rpc("retry_notification_delivery", { p_delivery_id: deliveryId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath(`/admin/jobs/${orderId}`);
  return { ok: true };
}

export async function updateOrderRecordDetailsAction(input: {
  orderId: string;
  beneficiaryCountry: string;
  beneficiaryState: string;
  beneficiaryVillage: string;
  partnerOrganisation: string;
  beneficiaryNames: string[];
  dedicationArabic: string;
  dedicationRemarks: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!UUID.test(input.orderId)) return { ok: false, error: "A valid job is required." };
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: "A verified administrator session is required." };
  const { error } = await admin.supabase.rpc("update_order_record_details", {
    p_order_id: input.orderId,
    p_beneficiary_country: input.beneficiaryCountry,
    p_beneficiary_state: input.beneficiaryState,
    p_beneficiary_village: input.beneficiaryVillage,
    p_partner_organisation: input.partnerOrganisation,
    p_beneficiary_names: input.beneficiaryNames,
    p_dedication_arabic: input.dedicationArabic,
    p_dedication_remarks: input.dedicationRemarks,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/jobs/${input.orderId}`);
  return { ok: true };
}

export async function resolveRefundedFulfilmentAction(orderId: string, reason: string): Promise<{ ok: boolean; error?: string; resolution?: string }> {
  if (!UUID.test(orderId)) return { ok: false, error: "A valid job is required." };
  if (!reason.trim()) return { ok: false, error: "Explain how the refunded job should be resolved." };
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: "A verified administrator session is required." };
  const { data, error } = await admin.supabase.rpc("resolve_refunded_fulfilment", {
    p_order_id: orderId,
    p_reason: reason.trim().slice(0, 1000),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/jobs");
  revalidatePath(`/admin/jobs/${orderId}`);
  return { ok: true, resolution: String(data) };
}

export async function resolveReportAction(reportId: string, source: "vendor" | "customer", notes: string): Promise<{ ok: boolean; error?: string }> {
  if (!reportId || !notes.trim()) return { ok: false, error: "Resolution notes are required." };
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: "Admin access required." };
  const { data, error } = await admin.supabase.rpc("resolve_support_report", {
    p_report_id: reportId,
    p_source: source,
    p_notes: notes.trim().slice(0, 2000),
  });
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "This report was already resolved or could not be found." };
  revalidatePath("/admin/support");
  revalidatePath("/admin/reports");
  return { ok: true };
}

export async function suspendVendorAction(vendorId: string, status: "active" | "suspended"): Promise<{ ok: boolean; error?: string }> {
  if (!UUID.test(vendorId)) return { ok: false, error: "A valid partner is required." };
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: "Admin access required." };
  const { supabase } = admin;
  const { error } = await supabase.from("profiles").update({ status }).eq("id", vendorId).eq("role", "vendor");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/vendors");
  revalidatePath(`/admin/vendors/${vendorId}`);
  return { ok: true };
}

export async function setCustomerStatusAction(customerId: string, status: "active" | "suspended"): Promise<{ ok: boolean; error?: string }> {
  if (!UUID.test(customerId)) return { ok: false, error: "A valid customer is required." };
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: "A verified administrator session is required." };
  const { error } = await admin.supabase.from("profiles").update({ status }).eq("id", customerId).eq("role", "customer");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
  return { ok: true };
}

export async function approveVendorAction(vendorId: string): Promise<{ ok: boolean; error?: string }> {
  if (!UUID.test(vendorId)) return { ok: false, error: "A valid partner is required." };
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: "A verified administrator session is required." };
  const { data, error } = await admin.supabase
    .from("profiles")
    .update({ status: "active", vendor_onboarding_status: "approved" })
    .eq("id", vendorId)
    .eq("role", "vendor")
    .in("vendor_onboarding_status", ["pending", "rejected"])
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Only a completed partner setup can be approved." };
  revalidatePath("/admin/vendors");
  revalidatePath(`/admin/vendors/${vendorId}`);
  return { ok: true };
}

export async function updateVendorRatingAction(vendorId: string, rating: number): Promise<{ ok: boolean; error?: string }> {
  if (!UUID.test(vendorId)) return { ok: false, error: "A valid partner is required." };
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) return { ok: false, error: "Rating must be between 0 and 5." };
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: "Admin access required." };
  const { supabase } = admin;
  const { error } = await supabase.from("profiles").update({ rating }).eq("id", vendorId).eq("role", "vendor");
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/vendors/${vendorId}`);
  return { ok: true };
}

export async function recordVendorPaymentAction(input: {
  vendorId: string;
  orderId: string;
  amountCents: number;
  paymentDate: string;
  method: string;
  reference: string;
  notes: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) return { ok: false, error: "Payment amount must be greater than zero." };
  if (!input.vendorId || !input.orderId) return { ok: false, error: "Select the verified job this payment settles." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.paymentDate)) return { ok: false, error: "Enter a valid payment date." };
  if (!input.reference.trim()) return { ok: false, error: "A unique payment reference is required." };
  const admin = await getFinanceAdminClient();
  if (!admin) return { ok: false, error: "Administrator finance access required." };
  const { error } = await admin.supabase.rpc("record_vendor_payment", {
    p_vendor_id: input.vendorId,
    p_order_id: input.orderId,
    p_amount: input.amountCents,
    p_payment_date: input.paymentDate,
    p_method: input.method.trim() || null,
    p_reference: input.reference.trim().slice(0, 200),
    p_notes: input.notes.trim().slice(0, 2000) || null,
    p_entry_type: "payment",
    p_reverses_payment_id: null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/vendors/${input.vendorId}`);
  revalidatePath(`/admin/jobs/${input.orderId}`);
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
  return { ok: true };
}

export async function reverseVendorPaymentAction(input: {
  paymentId: string;
  reference: string;
  notes: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!input.paymentId || !input.reference.trim()) return { ok: false, error: "A payment and unique reversal reference are required." };
  const admin = await getFinanceAdminClient();
  if (!admin) return { ok: false, error: "Administrator finance access required." };
  const { data: payment, error: lookupError } = await admin.supabase
    .from("vendor_payments")
    .select("id, vendor_id, order_id, amount")
    .eq("id", input.paymentId)
    .eq("entry_type", "payment")
    .maybeSingle();
  if (lookupError) return { ok: false, error: lookupError.message };
  if (!payment?.order_id || payment.amount <= 0) return { ok: false, error: "Only an order-linked payment can be reversed." };

  const { error } = await admin.supabase.rpc("record_vendor_payment", {
    p_vendor_id: payment.vendor_id,
    p_order_id: payment.order_id,
    p_amount: -payment.amount,
    p_payment_date: new Date().toISOString().slice(0, 10),
    p_method: "Reversal",
    p_reference: input.reference.trim().slice(0, 200),
    p_notes: input.notes.trim().slice(0, 2000) || "Administrative reversal",
    p_entry_type: "reversal",
    p_reverses_payment_id: payment.id,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/vendors/${payment.vendor_id}`);
  revalidatePath(`/admin/jobs/${payment.order_id}`);
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
  return { ok: true };
}
