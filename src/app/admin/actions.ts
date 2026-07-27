"use server";

import { revalidatePath } from "next/cache";
import { getAal2AdminAtLeast } from "@/lib/auth";
import { generateCompletionReportsForAdmin, ReportGenerationError } from "@/lib/reports/service";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
