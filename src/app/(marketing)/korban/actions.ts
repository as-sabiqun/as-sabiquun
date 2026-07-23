"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PACKAGE_SLUGS = { share: "korban-share", goat: "korban-goat", cow: "korban-cow" } as const;
type PackageId = keyof typeof PACKAGE_SLUGS;

export type SubmitKorbanState =
  | { ok: false; requiresLogin: true }
  | { ok: false; error: string }
  | undefined;

function reference() {
  const stamp = new Date().toISOString().slice(2, 7).replace("-", "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ASQ-${stamp}-${rand}`;
}

export async function submitKorbanOrder(_prevState: SubmitKorbanState, formData: FormData): Promise<SubmitKorbanState> {
  const packageId = String(formData.get("packageId") ?? "") as PackageId;
  const quantity = Number(formData.get("quantity") ?? 1);
  const names = formData.getAll("participantName").map(String).filter(Boolean);
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();

  if (!PACKAGE_SLUGS[packageId]) {
    return { ok: false, error: "Choose a package." };
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 7) {
    return { ok: false, error: "Shares must be between 1 and 7." };
  }
  if (names.length !== quantity) {
    return { ok: false, error: "Add a participant name for each share." };
  }
  if (!customerName || !customerPhone) {
    return { ok: false, error: "Your name and phone are required." };
  }

  if (!isSupabaseConfigured) {
    return { ok: false, error: "Checkout isn't connected yet — this is a working preview." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { ok: false, requiresLogin: true };
  }

  const admin = createAdminClient();

  const { data: offering, error: offeringError } = await admin
    .from("offerings")
    .select("id, unit_amount")
    .eq("slug", PACKAGE_SLUGS[packageId])
    .eq("active", true)
    .single();

  if (offeringError || !offering || !offering.unit_amount) {
    return { ok: false, error: "That package isn't available right now." };
  }

  const { data: settings } = await admin.from("platform_settings").select("commission_rate").single();
  const commissionRate = settings?.commission_rate ?? 0.1;

  const unitAmount = offering.unit_amount;
  const totalAmount = unitAmount * quantity;
  const commissionAmount = Math.round(totalAmount * commissionRate);
  const vendorPayoutAmount = totalAmount - commissionAmount;

  const { data: order, error: insertError } = await admin
    .from("orders")
    .insert({
      reference: reference(),
      customer_id: userData.user.id,
      offering_id: offering.id,
      service_type: "korban",
      category_slug: "korban",
      quantity,
      participant_names: names,
      customer_name: customerName,
      customer_phone: customerPhone,
      unit_amount: unitAmount,
      total_amount: totalAmount,
      commission_rate_snapshot: commissionRate,
      commission_amount: commissionAmount,
      vendor_payout_amount: vendorPayoutAmount,
      status: "submitted",
    })
    .select("reference")
    .single();

  if (insertError || !order) {
    return { ok: false, error: "Something went wrong creating your order. Please try again." };
  }

  redirect(`/dashboard/orders/${order.reference}`);
}
