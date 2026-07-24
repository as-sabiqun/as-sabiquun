"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// These call the SECURITY DEFINER RPC functions using the caller's own
// session — the functions check auth.uid()/assigned_vendor_id themselves.

export async function claimJobAction(orderId: string): Promise<{ ok: boolean; claimed?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_job", { p_order_id: orderId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendor-dashboard");
  revalidatePath("/vendor-dashboard/jobs");
  revalidatePath(`/vendor-dashboard/jobs/${orderId}`);
  return { ok: true, claimed: Boolean(data) };
}

export async function declineJobAction(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decline_job", { p_order_id: orderId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendor-dashboard");
  revalidatePath("/vendor-dashboard/jobs");
  return { ok: true };
}

export async function markInProgressAction(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mark_in_progress", { p_order_id: orderId });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/vendor-dashboard/jobs/${orderId}`);
  revalidatePath("/vendor-dashboard/board");
  return { ok: Boolean(data) };
}

export async function submitProofAction(
  orderId: string,
  items: { path: string; category: string }[],
  notes: string,
  location: { country: string; state: string; village: string; address: string; lat: number | null; lng: number | null; mapsLink: string }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_proof", {
    p_order_id: orderId,
    p_items: items,
    p_notes: notes || null,
    p_project_country: location.country || null,
    p_project_state: location.state || null,
    p_project_village: location.village || null,
    p_project_address: location.address || null,
    p_project_lat: location.lat,
    p_project_lng: location.lng,
    p_project_maps_link: location.mapsLink || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/vendor-dashboard/jobs/${orderId}`);
  revalidatePath("/vendor-dashboard/board");
  return { ok: Boolean(data) };
}

export async function fileReportAction(vendorId: string, orderId: string | null, subject: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("vendor_reports").insert({ vendor_id: vendorId, order_id: orderId, subject, message });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendor-dashboard/reports");
  return { ok: true };
}
