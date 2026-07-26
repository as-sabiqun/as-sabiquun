"use server";

import { revalidatePath } from "next/cache";
import { isApprovedVendor, sessionUsesAuthMethod } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createClient, getProfile } from "@/lib/supabase/server";

// These call the SECURITY DEFINER RPC functions using the caller's own
// session — the functions check auth.uid()/assigned_vendor_id themselves.

async function getVendorClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getProfile(supabase, user.id) : null;
  return user && isApprovedVendor(profile) && await sessionUsesAuthMethod(supabase, "password") ? { supabase, user } : null;
}

export async function claimJobAction(orderId: string): Promise<{ ok: boolean; claimed?: boolean; error?: string }> {
  const vendor = await getVendorClient();
  if (!vendor) return { ok: false, error: "An approved partner account is required." };
  const { supabase } = vendor;
  const { data, error } = await supabase.rpc("claim_job", { p_order_id: orderId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendor-dashboard");
  revalidatePath("/vendor-dashboard/jobs");
  revalidatePath(`/vendor-dashboard/jobs/${orderId}`);
  return { ok: true, claimed: Boolean(data) };
}

export async function declineJobAction(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const vendor = await getVendorClient();
  if (!vendor) return { ok: false, error: "An approved partner account is required." };
  const { supabase } = vendor;
  const { error } = await supabase.rpc("decline_job", { p_order_id: orderId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendor-dashboard");
  revalidatePath("/vendor-dashboard/jobs");
  return { ok: true };
}

export async function markInProgressAction(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const vendor = await getVendorClient();
  if (!vendor) return { ok: false, error: "An approved partner account is required." };
  const { supabase } = vendor;
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
  const vendor = await getVendorClient();
  if (!vendor) return { ok: false, error: "An approved partner account is required." };
  const { supabase } = vendor;
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
  const vendor = await getVendorClient();
  if (!vendor || vendor.user.id !== vendorId) return { ok: false, error: "An approved partner account is required." };
  const cleanSubject = subject.trim();
  const cleanMessage = message.trim();
  if (cleanSubject.length < 4 || cleanSubject.length > 120 || cleanMessage.length < 20 || cleanMessage.length > 2000) {
    return { ok: false, error: "Use a 4–120 character subject and a 20–2,000 character message." };
  }
  if (orderId) {
    const { data: order } = await vendor.supabase.from("vendor_assigned_orders").select("id").eq("id", orderId).maybeSingle();
    if (!order) return { ok: false, error: "Choose a job assigned to your organisation." };
  }
  try {
    if (!await consumeRateLimit("vendor-support", vendor.user.id, 5, 3600)) {
      return { ok: false, error: "You have sent several reports recently. Please wait before sending another." };
    }
  } catch {
    return { ok: false, error: "Support reporting is temporarily unavailable." };
  }
  const { error } = await vendor.supabase.from("vendor_reports").insert({ vendor_id: vendor.user.id, order_id: orderId, subject: cleanSubject, message: cleanMessage });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendor-dashboard/reports");
  return { ok: true };
}
