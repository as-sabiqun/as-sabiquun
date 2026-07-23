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
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, phone, role: "vendor", vendor_type: vendorType, services },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, email, password, live: true };
}
