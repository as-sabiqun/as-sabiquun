"use server";

import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";

async function getAdminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await getProfile(supabase, user.id);
  return profile?.role === "admin" && profile.status === "active" ? { supabase, user } : null;
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
  revalidatePath(`/admin/jobs/${orderId}`);
  return { ok: true, offered: data as number };
}

export async function reviewProofAction(orderId: string, approved: boolean, notes: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: "Admin access required." };
  const { supabase } = admin;
  const { data, error } = await supabase.rpc("review_proof", { p_order_id: orderId, p_approved: approved, p_notes: notes || null });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath(`/admin/jobs/${orderId}`);
  return { ok: Boolean(data) };
}

export async function recordCustomerDeliveryAction(orderId: string, channel: "email" | "telegram", delivered: boolean): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: "Admin access required." };
  const { data, error } = await admin.supabase.rpc("record_customer_delivery", {
    p_order_id: orderId,
    p_channel: channel,
    p_delivered: delivered,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath(`/admin/jobs/${orderId}`);
  return { ok: Boolean(data) };
}

export async function resolveReportAction(reportId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: "Admin access required." };
  const { supabase } = admin;
  const { error } = await supabase
    .from("vendor_reports")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/reports");
  return { ok: true };
}

export async function suspendVendorAction(vendorId: string, status: "active" | "suspended"): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: "Admin access required." };
  const { supabase } = admin;
  const { error } = await supabase.from("profiles").update({ status }).eq("id", vendorId).eq("role", "vendor");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/vendors");
  revalidatePath(`/admin/vendors/${vendorId}`);
  return { ok: true };
}

export async function updateVendorRatingAction(vendorId: string, rating: number): Promise<{ ok: boolean; error?: string }> {
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
  orderId: string | null;
  amountCents: number;
  paymentDate: string;
  method: string;
  reference: string;
  notes: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) return { ok: false, error: "Payment amount must be greater than zero." };
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: "Admin access required." };
  const { supabase, user } = admin;

  const { error } = await supabase.from("vendor_payments").insert({
    vendor_id: input.vendorId,
    order_id: input.orderId,
    amount: input.amountCents,
    payment_date: input.paymentDate,
    method: input.method || null,
    reference: input.reference || null,
    notes: input.notes || null,
    recorded_by: user.id,
  });

  if (error) return { ok: false, error: error.message };
  if (input.orderId) {
    const { error: closureError } = await supabase.rpc("sync_order_closure", { p_order_id: input.orderId });
    if (closureError) return { ok: false, error: closureError.message };
  }
  revalidatePath(`/admin/vendors/${input.vendorId}`);
  if (input.orderId) revalidatePath(`/admin/jobs/${input.orderId}`);
  return { ok: true };
}
