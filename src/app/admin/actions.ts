"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// These call the SECURITY DEFINER RPC functions from the migrations using the
// caller's own session (not the service-role client) — the functions check
// is_admin()/auth.uid() themselves, so this stays correctly scoped to
// whichever admin is actually signed in.

export async function broadcastOrderAction(orderId: string): Promise<{ ok: boolean; error?: string; offered?: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("broadcast_order", { p_order_id: orderId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath(`/admin/jobs/${orderId}`);
  return { ok: true, offered: data as number };
}

export async function reviewProofAction(orderId: string, approved: boolean, notes: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("review_proof", { p_order_id: orderId, p_approved: approved, p_notes: notes || null });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath(`/admin/jobs/${orderId}`);
  return { ok: Boolean(data) };
}

export async function resolveReportAction(reportId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendor_reports")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/reports");
  return { ok: true };
}

export async function suspendVendorAction(vendorId: string, status: "active" | "suspended"): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ status }).eq("id", vendorId).eq("role", "vendor");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/vendors");
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
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase.from("vendor_payments").insert({
    vendor_id: input.vendorId,
    order_id: input.orderId,
    amount: input.amountCents,
    payment_date: input.paymentDate,
    method: input.method || null,
    reference: input.reference || null,
    notes: input.notes || null,
    recorded_by: userData.user?.id ?? null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/vendors/${input.vendorId}`);
  if (input.orderId) revalidatePath(`/admin/jobs/${input.orderId}`);
  return { ok: true };
}
