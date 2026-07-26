import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveAdmin, getAdminMfaState } from "@/lib/auth";
import { safeAdminRedirectPath } from "@/lib/auth-redirect";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AdminSignInForm } from "./form";

export const metadata: Metadata = {
  title: "Administrator sign in",
  robots: { index: false, follow: false },
};

export default async function AdminSignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const next = safeAdminRedirectPath(params.next);

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const admin = await getActiveAdmin(supabase);
    if (admin) {
      const mfaState = await getAdminMfaState(supabase);
      if (mfaState === "verified") redirect(next);
      if (mfaState === "challenge") redirect(`/admin/mfa/challenge?next=${encodeURIComponent(next)}`);
      if (mfaState === "enroll") redirect(`/admin/mfa/enroll?next=${encodeURIComponent(next)}`);
    }
  }

  return (
    <section className="auth-shell">
      <div className="container flex justify-center">
        <AdminSignInForm next={next} initialError={params.error} />
      </div>
    </section>
  );
}
