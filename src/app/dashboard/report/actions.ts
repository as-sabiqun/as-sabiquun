"use server";

import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";

export type CustomerReportState = { ok?: boolean; error?: string } | undefined;

const categories = new Set(["order", "payment", "evidence", "account", "other"]);

export async function submitCustomerReport(_previous: CustomerReportState, formData: FormData): Promise<CustomerReportState> {
  const category = String(formData.get("category") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const orderId = String(formData.get("order_id") ?? "").trim() || null;

  if (!categories.has(category)) return { error: "Choose what you need help with." };
  if (subject.length < 4 || subject.length > 120) return { error: "Use a subject between 4 and 120 characters." };
  if (message.length < 20 || message.length > 2000) return { error: "Tell us what happened in 20 to 2,000 characters." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Your session has expired. Log in and try again." };
  const profile = await getProfile(supabase, data.user.id);
  if (profile?.role !== "customer" || profile.status !== "active") return { error: "This account cannot submit customer reports." };

  if (orderId) {
    const { data: order } = await supabase.from("orders").select("id").eq("id", orderId).eq("customer_id", data.user.id).maybeSingle();
    if (!order) return { error: "Choose an order that belongs to this account." };
  }

  const { error } = await supabase.from("customer_reports").insert({
    customer_id: data.user.id,
    order_id: orderId,
    category,
    subject,
    message,
  });

  if (error) return { error: "The report could not be saved yet. Contact us on WhatsApp at +65 8993 3786." };
  revalidatePath("/dashboard/report");
  return { ok: true };
}
