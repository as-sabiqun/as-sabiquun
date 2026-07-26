"use server";

import { revalidatePath } from "next/cache";
import { getAal2Admin } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/server";

export type CreateVendorState =
  | { ok: true; email: string; live: boolean }
  | { ok: false; error: string }
  | undefined;

type InvitationResult = { ok: true } | { ok: false; error: string };

async function reissueExistingVendorInvitation(input: {
  serviceClient: ReturnType<typeof createAdminClient>;
  vendorId: string;
  email: string;
  invitedBy: string;
  siteUrl: string;
  name?: string;
  notes?: string | null;
}): Promise<InvitationResult> {
  const { serviceClient, vendorId, email, invitedBy, siteUrl } = input;
  const [{ data: profile, error: profileError }, { data: authData, error: authError }] = await Promise.all([
    serviceClient
      .from("profiles")
      .select("id, role, status, vendor_onboarding_status")
      .eq("id", vendorId)
      .maybeSingle(),
    serviceClient.auth.admin.getUserById(vendorId),
  ]);
  const authEmail = authData.user?.email?.trim().toLowerCase();
  if (
    profileError
    || authError
    || !profile
    || profile.role !== "vendor"
    || profile.status !== "active"
    || profile.vendor_onboarding_status !== "invited"
    || authEmail !== email
  ) {
    return { ok: false, error: "Only an active partner who has not completed setup can be re-invited." };
  }

  const { error: expireError } = await serviceClient
    .from("vendor_invitations")
    .update({ status: "expired" })
    .eq("auth_user_id", vendorId)
    .eq("status", "invited");
  if (expireError) return { ok: false, error: "The previous invitation could not be closed safely." };

  const { data: invitation, error: invitationError } = await serviceClient
    .from("vendor_invitations")
    .insert({ email, invited_by: invitedBy, auth_user_id: vendorId, status: "invited" })
    .select("id")
    .single();
  if (invitationError) return { ok: false, error: "A fresh invitation record could not be created." };

  if (input.name !== undefined) {
    const { error: updateError } = await serviceClient
      .from("profiles")
      .update({ display_name: input.name, notes: input.notes ?? null })
      .eq("id", vendorId)
      .eq("role", "vendor")
      .eq("vendor_onboarding_status", "invited");
    if (updateError) {
      await serviceClient.from("vendor_invitations").update({ status: "revoked" }).eq("id", invitation.id);
      return { ok: false, error: "The partner record could not be prepared for re-invitation." };
    }
  }

  const { error: recoveryError } = await serviceClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?intent=vendor&next=/update-password`,
  });
  if (recoveryError) {
    await serviceClient.from("vendor_invitations").update({ status: "revoked" }).eq("id", invitation.id);
    return { ok: false, error: "The secure invitation email could not be resent." };
  }

  return { ok: true };
}

export async function createVendorAccount(_prevState: CreateVendorState, formData: FormData): Promise<CreateVendorState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { ok: false, error: "Fill in a valid organisation name and email." };
  }
  if (name.length > 200 || (notes?.length ?? 0) > 2000) {
    return { ok: false, error: "One or more vendor details are too long." };
  }

  if (!isSupabaseConfigured) return { ok: false, error: "Supabase is not configured on this deployment." };

  const sessionClient = await createClient();
  const admin = await getAal2Admin(sessionClient);
  if (!admin) return { ok: false, error: "A verified administrator session is required." };
  if (!isSupabaseAdminConfigured) return { ok: false, error: "The Supabase server secret is not configured." };

  const serviceClient = createAdminClient();
  const { data: previousInvitation, error: previousInvitationError } = await serviceClient
    .from("vendor_invitations")
    .select("auth_user_id")
    .eq("email", email)
    .not("auth_user_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (previousInvitationError) return { ok: false, error: "Existing invitations could not be checked." };

  const siteUrl = await getSiteUrl();
  if (previousInvitation?.auth_user_id) {
    const result = await reissueExistingVendorInvitation({
      serviceClient,
      vendorId: previousInvitation.auth_user_id,
      email,
      invitedBy: admin.user.id,
      siteUrl,
      name,
      notes,
    });
    if (!result.ok) return { ok: false, error: result.error };
    revalidatePath("/admin/vendors");
    revalidatePath(`/admin/vendors/${previousInvitation.auth_user_id}`);
    return { ok: true, email, live: true };
  }

  const { error: staleInvitationError } = await serviceClient
    .from("vendor_invitations")
    .update({ status: "expired" })
    .eq("email", email)
    .eq("status", "invited")
    .lte("expires_at", new Date().toISOString());
  if (staleInvitationError) return { ok: false, error: "Expired invitations could not be closed safely." };

  const { data: invitation, error: invitationError } = await serviceClient
    .from("vendor_invitations")
    .insert({ email, invited_by: admin.user.id, status: "invited" })
    .select("id")
    .single();
  if (invitationError) return { ok: false, error: invitationError.code === "23505" ? "An active invitation already exists for this email." : invitationError.message };

  const { data: invited, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name },
    redirectTo: `${siteUrl}/auth/callback?intent=vendor&next=/update-password`,
  });

  if (inviteError || !invited.user) {
    await serviceClient.from("vendor_invitations").update({ status: "revoked" }).eq("id", invitation.id);
    return { ok: false, error: inviteError?.message ?? "The invitation could not be sent." };
  }

  const { error: profileError } = await serviceClient
    .from("profiles")
    .update({
      role: "vendor",
      status: "active",
      vendor_onboarding_status: "invited",
      display_name: name,
      services: [],
      currency: "SGD",
      notes,
    })
    .eq("id", invited.user.id);

  if (profileError) {
    await serviceClient.from("vendor_invitations").update({ status: "revoked" }).eq("id", invitation.id);
    await serviceClient.auth.admin.deleteUser(invited.user.id);
    return { ok: false, error: "The invitation was not completed. No partner account was created." };
  }

  const { error: linkError } = await serviceClient
    .from("vendor_invitations")
    .update({ auth_user_id: invited.user.id })
    .eq("id", invitation.id);
  if (linkError) {
    await serviceClient.from("vendor_invitations").update({ status: "revoked" }).eq("id", invitation.id);
    await serviceClient.auth.admin.deleteUser(invited.user.id);
    return { ok: false, error: "The invitation record could not be linked. No partner account was created." };
  }

  revalidatePath("/admin/vendors");
  return { ok: true, email, live: true };
}

export async function resendVendorInvitationAction(vendorId: string): Promise<InvitationResult> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vendorId)) {
    return { ok: false, error: "A valid partner account is required." };
  }
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase is not configured on this deployment." };

  const sessionClient = await createClient();
  const admin = await getAal2Admin(sessionClient);
  if (!admin) return { ok: false, error: "A verified administrator session is required." };
  if (!isSupabaseAdminConfigured) return { ok: false, error: "The Supabase server secret is not configured." };

  const serviceClient = createAdminClient();
  const { data: authData, error: authError } = await serviceClient.auth.admin.getUserById(vendorId);
  const email = authData.user?.email?.trim().toLowerCase();
  if (authError || !email) return { ok: false, error: "The partner email account could not be found." };

  const result = await reissueExistingVendorInvitation({
    serviceClient,
    vendorId,
    email,
    invitedBy: admin.user.id,
    siteUrl: await getSiteUrl(),
  });
  if (!result.ok) return result;

  revalidatePath("/admin/vendors");
  revalidatePath(`/admin/vendors/${vendorId}`);
  return { ok: true };
}
