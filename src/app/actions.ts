"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseOrder, type FulfilmentStatus } from "@/lib/domain";
import { createServerSupabase, createServiceSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: string };

export async function createOrder(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    if (!isSupabaseConfigured) throw new Error("The connected demo backend has not been configured yet.");
    const offeringId = String(formData.get("offering_id") || "");
    const supabase = createServiceSupabase();
    const { data: offering } = await supabase.from("offerings").select("*").eq("id", offeringId).eq("active", true).single();
    if (!offering) throw new Error("This demonstration offering is unavailable.");
    const values = parseOrder(formData, offering);
    const { data, error } = await supabase.rpc("create_demo_order", {
      p_offering_id: offering.id,
      p_quantity: values.quantity,
      p_participant_names: values.participantNames,
      p_dedication: values.dedication,
      p_notes: String(formData.get("notes") || "").trim() || null,
      p_full_name: values.fullName,
      p_email: values.email,
      p_phone: values.phone,
      p_total_amount: values.amount,
    });
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    redirect(`/checkout/demo/${result.checkout_token}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { error: error instanceof Error ? error.message : "Could not create the order." };
  }
}

export async function completeDemoPayment(token: string) {
  if (!isSupabaseConfigured) return;
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.from("orders").update({ payment_status: "paid" }).eq("checkout_token", token).eq("payment_status", "pending").select("reference").single();
  if (error || !data) redirect(`/checkout/demo/${token}?error=payment`);
  redirect(`/order/success/${data.reference}`);
}

export async function submitEnquiry(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    if (!isSupabaseConfigured) throw new Error("The connected demo backend has not been configured yet.");
    const full_name = String(formData.get("full_name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const message = String(formData.get("message") || "").trim();
    if (full_name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || message.length < 10) throw new Error("Please complete your name, email, and message.");
    const { error } = await createServiceSupabase().from("enquiries").insert({ full_name, email, phone: String(formData.get("phone") || "").trim() || null, topic: String(formData.get("topic") || "other"), message });
    if (error) throw error;
    return { success: "Thank you. Your demonstration enquiry is now visible to the admin." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Could not submit the enquiry." }; }
}

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email: String(formData.get("email") || ""), password: String(formData.get("password") || "") });
    if (error) throw new Error("The email or password is incorrect.");
    redirect("/dashboard");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { error: error instanceof Error ? error.message : "Could not sign in." };
  }
}

export async function logout() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}

async function requireProfile(role?: "admin" | "vendor") {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from("profiles").select("id, role, display_name").eq("id", user.id).single();
  if (!profile || (role && profile.role !== role)) throw new Error("Unauthorized");
  return profile as { id: string; role: "admin" | "vendor"; display_name: string };
}

export async function assignOrder(orderId: string, formData: FormData) {
  await requireProfile("admin");
  const vendorId = String(formData.get("vendor_id") || "");
  const { error } = await createServiceSupabase().from("orders").update({ assigned_vendor_id: vendorId, fulfilment_status: "assigned" }).eq("id", orderId);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function updateOrderStatus(orderId: string, formData: FormData) {
  const profile = await requireProfile();
  const status = String(formData.get("status")) as FulfilmentStatus;
  const allowed = profile.role === "admin" ? ["in_progress", "proof_submitted", "completed"] : ["in_progress", "proof_submitted"];
  if (!allowed.includes(status)) throw new Error("Invalid status change");
  const query = createServiceSupabase().from("orders").update({ fulfilment_status: status, review_note: String(formData.get("review_note") || "").trim() || null }).eq("id", orderId);
  const { error } = profile.role === "vendor" ? await query.eq("assigned_vendor_id", profile.id) : await query;
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function saveProof(orderId: string, path: string, mediaType: string, caption: string) {
  const profile = await requireProfile("vendor");
  const service = createServiceSupabase();
  const { data: order } = await service.from("orders").select("id").eq("id", orderId).eq("assigned_vendor_id", profile.id).single();
  if (!order) throw new Error("This order is not assigned to you.");
  const { error } = await service.from("proofs").insert({ order_id: orderId, uploaded_by: profile.id, storage_path: path, media_type: mediaType, caption: caption || null });
  if (error) throw error;
  await service.from("orders").update({ fulfilment_status: "proof_submitted" }).eq("id", orderId);
  revalidatePath("/dashboard");
}

export async function updateOffering(offeringId: string, formData: FormData) {
  await requireProfile("admin");
  const { error } = await createServiceSupabase().from("offerings").update({ active: formData.get("active") === "on" }).eq("id", offeringId);
  if (error) throw error;
  revalidatePath("/dashboard");
}
