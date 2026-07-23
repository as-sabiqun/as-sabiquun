"use server";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PROJECT_MAP = {
  "water-pump": { slug: "wakaf-water-pump", category: "water" },
  quran: { slug: "wakaf-quran", category: "quran" },
  "food-for-orphans": { slug: "wakaf-food-for-orphans", category: "orphans" },
} as const;
type ProjectId = keyof typeof PROJECT_MAP;

export type SubmitWakafState =
  | { ok: true; reference: string }
  | { ok: false; requiresLogin: true }
  | { ok: false; error: string }
  | undefined;

function reference() {
  const stamp = new Date().toISOString().slice(2, 7).replace("-", "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ASQ-${stamp}-${rand}`;
}

export async function submitWakafContribution(_prevState: SubmitWakafState, formData: FormData): Promise<SubmitWakafState> {
  const projectId = String(formData.get("projectId") ?? "") as ProjectId;
  const amount = Number(formData.get("amount") ?? 0);
  const dedication = String(formData.get("dedication") ?? "").trim() || null;
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();

  const project = PROJECT_MAP[projectId];
  if (!project) {
    return { ok: false, error: "Choose a project." };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Enter a valid contribution amount." };
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
    .select("id, min_amount")
    .eq("slug", project.slug)
    .eq("active", true)
    .single();

  if (offeringError || !offering || offering.min_amount == null) {
    return { ok: false, error: "That project isn't available right now." };
  }

  const totalAmount = Math.round(amount);
  if (totalAmount < offering.min_amount) {
    return { ok: false, error: `Contribution must be at least S$${offering.min_amount}.` };
  }

  const { data: settings } = await admin.from("platform_settings").select("commission_rate").single();
  const commissionRate = settings?.commission_rate ?? 0.1;
  const commissionAmount = Math.round(totalAmount * commissionRate);
  const vendorPayoutAmount = totalAmount - commissionAmount;

  const { data: order, error: insertError } = await admin
    .from("orders")
    .insert({
      reference: reference(),
      customer_id: userData.user.id,
      offering_id: offering.id,
      service_type: "wakaf",
      category_slug: project.category,
      dedication,
      customer_name: customerName,
      customer_phone: customerPhone,
      unit_amount: totalAmount,
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

  return { ok: true, reference: order.reference };
}
