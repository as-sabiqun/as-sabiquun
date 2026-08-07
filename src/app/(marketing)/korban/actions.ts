"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { isContactNumber } from "@/lib/checkout-validation";
import { createClient, getProfile, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { customerAccessMessage, isCustomerAccount } from "@/lib/auth";

const LEGACY_PACKAGE_SLUGS: Record<string, string> = { share: "korban-share", goat: "korban-goat", cow: "korban-cow" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SubmitKorbanState =
  | { ok: false; requiresLogin: true }
  | { ok: false; error: string }
  | undefined;

function reference() {
  const stamp = new Date().toISOString().slice(2, 7).replace("-", "");
  const rand = randomUUID().slice(0, 8).toUpperCase();
  return `ASQ-${stamp}-${rand}`;
}

export async function submitKorbanOrder(_prevState: SubmitKorbanState, formData: FormData): Promise<SubmitKorbanState> {
  const packageId = String(formData.get("packageId") ?? "");
  const packageSlug = LEGACY_PACKAGE_SLUGS[packageId] ?? packageId;
  const requestId = String(formData.get("requestId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const names = formData.getAll("participantName").map((name) => String(name).trim()).filter(Boolean);
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(packageSlug) || packageSlug.length > 80) {
    return { ok: false, error: "Choose a package." };
  }
  if (!UUID.test(requestId)) return { ok: false, error: "This checkout draft expired. Refresh and try again." };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 7) {
    return { ok: false, error: "Quantity must be between 1 and 7." };
  }
  if (names.length !== quantity) {
    return { ok: false, error: "Add a participant name for each package." };
  }
  if (names.some((name) => name.length > 120) || customerName.length > 120) {
    return { ok: false, error: "Names must be 120 characters or fewer." };
  }
  if (!isContactNumber(customerPhone)) {
    return { ok: false, error: "Enter a valid contact number." };
  }
  if (!customerName || !customerPhone) {
    return { ok: false, error: "Your name and phone are required." };
  }

  if (!isSupabaseConfigured) {
    return { ok: false, error: "Checkout is not configured on this deployment." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { ok: false, requiresLogin: true };
  }
  const profile = await getProfile(supabase, userData.user.id);
  if (!await isCustomerAccount(supabase, userData.user, profile)) {
    return { ok: false, error: customerAccessMessage(profile) };
  }

  const admin = createAdminClient();

  const { data: offering, error: offeringError } = await admin
    .from("offerings")
    .select("id, title, detail, unit_amount")
    .eq("slug", packageSlug)
    .eq("service_type", "korban")
    .eq("category_slug", "korban")
    .eq("active", true)
    .single();

  if (offeringError || !offering || !offering.unit_amount) {
    return { ok: false, error: "That package isn't available right now." };
  }

  const { data: settings, error: settingsError } = await admin.from("platform_settings").select("commission_rate").single();
  if (settingsError || settings?.commission_rate == null) {
    return { ok: false, error: "Checkout pricing is temporarily unavailable." };
  }
  const commissionRate = Number(settings.commission_rate);

  const unitAmount = offering.unit_amount;
  const totalAmount = unitAmount * quantity;
  const commissionAmount = Math.round(totalAmount * commissionRate);
  const vendorPayoutAmount = totalAmount - commissionAmount;

  const { data: inserted, error: insertError } = await admin
    .from("orders")
    .upsert({
      client_request_id: requestId,
      reference: reference(),
      customer_id: userData.user.id,
      offering_id: offering.id,
      offering_title: offering.title,
      offering_detail: offering.detail,
      service_type: "korban",
      category_slug: "korban",
      quantity,
      participant_names: names,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: userData.user.email,
      unit_amount: unitAmount,
      total_amount: totalAmount,
      commission_rate_snapshot: commissionRate,
      commission_amount: commissionAmount,
      vendor_payout_amount: vendorPayoutAmount,
      currency: "SGD",
      payment_provider: "hitpay",
      payment_status: "pending",
      fulfilment_status: "not_ready",
      delivery_status: "not_ready",
      settlement_status: "unpaid",
      status: "submitted",
    }, { onConflict: "customer_id,client_request_id", ignoreDuplicates: true })
    .select("reference")
    .maybeSingle();

  if (insertError) {
    return { ok: false, error: "Something went wrong creating your order. Please try again." };
  }
  const order = inserted ?? (await admin.from("orders").select("reference").eq("customer_id", userData.user.id).eq("client_request_id", requestId).single()).data;
  if (!order) return { ok: false, error: "Something went wrong creating your order. Please try again." };

  redirect(`/checkout/${order.reference}`);
}
