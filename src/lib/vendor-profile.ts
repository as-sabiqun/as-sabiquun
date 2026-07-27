import type { Profile } from "@/lib/supabase/server";

type VendorProfileDetails = Pick<
  Profile,
  | "display_name"
  | "contact_person"
  | "phone"
  | "country"
  | "city_address"
  | "vendor_type"
  | "services"
  | "bank_name"
  | "bank_account_name"
  | "bank_account_number"
>;

export function hasCompleteVendorProfile(profile: VendorProfileDetails): boolean {
  return Boolean(
    profile.display_name.trim()
    && profile.contact_person?.trim()
    && profile.phone?.trim()
    && profile.country?.trim()
    && profile.city_address?.trim()
    && profile.vendor_type?.trim()
    && profile.services.length
    && profile.bank_name?.trim()
    && profile.bank_account_name?.trim()
    && profile.bank_account_number?.trim()
  );
}
