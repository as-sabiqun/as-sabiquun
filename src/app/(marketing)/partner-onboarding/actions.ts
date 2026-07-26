"use server";

import { redirect } from "next/navigation";
import { sessionUsesAuthMethod } from "@/lib/auth";
import { isContactNumber } from "@/lib/checkout-validation";
import { createClient, getProfile } from "@/lib/supabase/server";
import { vendorServiceOptions, vendorTypes } from "@/lib/vendor-options";

export type PartnerOnboardingState = { error: string } | undefined;

export async function completePartnerOnboarding(_state: PartnerOnboardingState, formData: FormData): Promise<PartnerOnboardingState> {
  const organisationName = String(formData.get("organisationName") ?? "").trim();
  const contactPerson = String(formData.get("contactPerson") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const cityAddress = String(formData.get("cityAddress") ?? "").trim();
  const vendorType = String(formData.get("vendorType") ?? "").trim();
  const services = [...new Set(formData.getAll("services").map(String))];
  const bankName = String(formData.get("bankName") ?? "").trim();
  const bankAccountName = String(formData.get("bankAccountName") ?? "").trim();
  const bankAccountNumber = String(formData.get("bankAccountNumber") ?? "").trim();
  const swiftCode = String(formData.get("swiftCode") ?? "").trim();
  const allowedServices = new Set(vendorServiceOptions.map((item) => item.slug));

  if (!organisationName || !contactPerson || !country || !cityAddress || !bankName || !bankAccountName || !bankAccountNumber || !isContactNumber(phone)) {
    return { error: "Complete every required organisation, contact, location, and bank field." };
  }
  if (whatsapp && !isContactNumber(whatsapp)) return { error: "Enter a valid WhatsApp number or leave it blank." };
  if (!vendorTypes.includes(vendorType as (typeof vendorTypes)[number])) return { error: "Choose a valid partner type." };
  if (!services.length || services.some((service) => !allowedServices.has(service as (typeof vendorServiceOptions)[number]["slug"]))) {
    return { error: "Choose at least one valid service capability." };
  }
  if ([organisationName, contactPerson, phone, whatsapp, country, cityAddress, vendorType, bankName, bankAccountName, bankAccountNumber, swiftCode].some((value) => value.length > 200)) {
    return { error: "One or more details are too long." };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const profile = authData.user ? await getProfile(supabase, authData.user.id) : null;
  if (!authData.user || await sessionUsesAuthMethod(supabase, "oauth") || profile?.role !== "vendor" || profile.vendor_onboarding_status !== "invited") {
    return { error: "This partner invitation is no longer available." };
  }

  const { data, error } = await supabase.rpc("complete_vendor_onboarding", {
    p_organisation_name: organisationName,
    p_contact_person: contactPerson,
    p_phone: phone,
    p_whatsapp: whatsapp || null,
    p_country: country,
    p_city_address: cityAddress,
    p_vendor_type: vendorType,
    p_services: services,
    p_bank_name: bankName,
    p_bank_account_name: bankAccountName,
    p_bank_account_number: bankAccountNumber,
    p_swift_code: swiftCode || null,
  });
  if (error || !data) return { error: error?.message ?? "Partner onboarding could not be completed." };

  await supabase.auth.signOut();
  redirect("/partner-login?message=Setup complete. Your partner account is awaiting administrator approval.");
}
