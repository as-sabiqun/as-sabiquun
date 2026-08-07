"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { offeringCategory, offeringFields, offeringSlug, type OfferingPricing } from "@/lib/admin-offerings";
import { getAal2AdminAtLeast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function servicesRedirect(kind: "message" | "error", message: string): never {
  redirect(`/admin/services?${kind}=${encodeURIComponent(message)}`);
}

async function catalogContext() {
  const supabase = await createClient();
  return await getAal2AdminAtLeast(supabase, "administrator") ? supabase : null;
}

export async function updateOfferingAction(formData: FormData) {
  const supabase = await catalogContext();
  if (!supabase) servicesRedirect("error", "Administrator access is required to change services.");

  const id = String(formData.get("id") ?? "");
  const { data: offering, error: loadError } = await supabase.from("offerings").select("service_type").eq("id", id).maybeSingle();
  if (loadError || !offering || !["korban", "wakaf"].includes(offering.service_type)) servicesRedirect("error", "That service could not be found.");

  const input = offeringFields(formData, offering.service_type as OfferingPricing);
  if (!input.ok) servicesRedirect("error", input.error);
  const { error } = await supabase.from("offerings").update(input.values).eq("id", id);
  if (error) servicesRedirect("error", "The service could not be updated. Refresh and try again, or contact the platform owner.");

  updateTag("offerings");
  servicesRedirect("message", `${input.values.title} was updated.`);
}

export async function addOfferingAction(formData: FormData) {
  const supabase = await catalogContext();
  if (!supabase) servicesRedirect("error", "Administrator access is required to add packages.");

  const category = offeringCategory(formData.get("category"));
  if (!category) servicesRedirect("error", "Choose a supported service.");
  const input = offeringFields(formData, category.pricing);
  if (!input.ok) servicesRedirect("error", input.error);
  const slug = offeringSlug(category.category, input.values.title);
  if (!slug) servicesRedirect("error", "Use a package title containing letters or numbers.");

  const { data: last } = await supabase.from("offerings").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("offerings").insert({
    ...input.values,
    slug,
    service_type: category.serviceType,
    category_slug: category.category,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) {
    servicesRedirect("error", error.code === "23505" ? "A package with that title already exists for this service." : "The package could not be added. Refresh and try again, or contact the platform owner.");
  }

  updateTag("offerings");
  servicesRedirect("message", `${input.values.title} was added.`);
}
