"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { dollarsToCents, isContactNumber } from "@/lib/checkout-validation";
import { createClient, getProfile, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCents } from "@/lib/orders";
import { customerAccessMessage, isCustomerAccount } from "@/lib/auth";

const PROJECT_MAP = {
  "water-pump": { category: "water" },
  quran: { category: "quran" },
  "food-for-orphans": { category: "orphans" },
} as const;
type ProjectId = keyof typeof PROJECT_MAP;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SubmitWakafState =
  | { ok: false; requiresLogin: true }
  | { ok: false; error: string }
  | undefined;

function reference() {
  const stamp = new Date().toISOString().slice(2, 7).replace("-", "");
  const rand = randomUUID().slice(0, 8).toUpperCase();
  return `ASQ-${stamp}-${rand}`;
}

export async function submitWakafContribution(_prevState: SubmitWakafState, formData: FormData): Promise<SubmitWakafState> {
  const projectId = String(formData.get("projectId") ?? "") as ProjectId;
  const offeringId = String(formData.get("offeringId") ?? "");
  const requestId = String(formData.get("requestId") ?? "");
  const amountDollars = Number(formData.get("amount") ?? 0);
  const dedication = String(formData.get("dedication") ?? "").trim() || null;
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();

  const project = PROJECT_MAP[projectId];
  if (!project) {
    return { ok: false, error: "Choose a project." };
  }
  if (!UUID.test(requestId)) return { ok: false, error: "This checkout draft expired. Refresh and try again." };
  if (!UUID.test(offeringId)) return { ok: false, error: "Choose an available package." };
  const totalAmount = dollarsToCents(amountDollars);
  if (totalAmount === null) {
    return { ok: false, error: "Enter a valid contribution amount." };
  }
  if ((dedication?.length ?? 0) > 300 || customerName.length > 120) {
    return { ok: false, error: "The dedication or customer name is too long." };
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
    .select("id, title, detail, min_amount")
    .eq("id", offeringId)
    .eq("service_type", "wakaf")
    .eq("category_slug", project.category)
    .eq("active", true)
    .single();

  if (offeringError || !offering || offering.min_amount == null) {
    return { ok: false, error: "That project isn't available right now." };
  }

  // Money is stored in cents; the form collects a plain dollar amount.
  if (totalAmount < offering.min_amount) {
    return { ok: false, error: `Contribution must be at least ${formatCents(offering.min_amount)}.` };
  }

  const { data: settings, error: settingsError } = await admin.from("platform_settings").select("commission_rate").single();
  if (settingsError || settings?.commission_rate == null) {
    return { ok: false, error: "Checkout pricing is temporarily unavailable." };
  }
  const commissionRate = Number(settings.commission_rate);
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
      service_type: "wakaf",
      category_slug: project.category,
      dedication,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: userData.user.email,
      unit_amount: totalAmount,
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
