"use server";

import { isSupabaseAdminConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateVendorState =
  | { ok: true; email: string; password: string; live: boolean }
  | { ok: false; error: string }
  | undefined;

export async function createVendorAccount(_prevState: CreateVendorState, formData: FormData): Promise<CreateVendorState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const vendorType = String(formData.get("vendorType") ?? "").trim();
  const services = formData.getAll("services").map(String);

  if (!name || !email || !phone || !password) {
    return { ok: false, error: "Fill in name, email, phone, and password." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (services.length === 0) {
    return { ok: false, error: "Choose at least one service this vendor can fulfil." };
  }

  if (!isSupabaseAdminConfigured) {
    return { ok: true, email, password, live: false };
  }

  const supabase = createAdminClient();

  // Note: full_name here only seeds the auth user's metadata for reference —
  // the on_auth_user_created trigger always creates the profiles row as
  // role='customer' regardless of what's in metadata, since the anon key is
  // public and a signup call could be made directly against Supabase's API
  // with arbitrary metadata. The explicit UPDATE below (service-role only)
  // is what actually grants vendor access.
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (createError) {
    return { ok: false, error: createError.message };
  }

  const { error: promoteError } = await supabase
    .from("profiles")
    .update({ role: "vendor", display_name: name, phone, vendor_type: vendorType, services })
    .eq("id", created.user.id);

  if (promoteError) {
    return { ok: false, error: promoteError.message };
  }

  return { ok: true, email, password, live: true };
}
