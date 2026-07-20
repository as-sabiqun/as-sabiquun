import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions";
import { Brand } from "@/components/brand";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { arePortalDemosEnabled, createServerSupabase, isAuthConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account setup",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const params = await searchParams;
  const role: "vendor" | "customer" = params.role === "vendor" ? "vendor" : "customer";

  if (!isAuthConfigured && !arePortalDemosEnabled) redirect("/login");

  if (isAuthConfigured) {
    const supabase = await createServerSupabase();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (!userId) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    if (profile?.role === "admin") redirect("/admin");
    if (profile?.role === "vendor") redirect("/vendor-dashboard");
    if (profile?.role === "customer") redirect("/dashboard");

    return (
      <main className="pattern grid min-h-screen place-items-center p-5">
        <section className="card w-full max-w-lg p-7 shadow-[0_28px_80px_rgba(7,63,70,.12)] md:p-9">
          <Brand />
          <p className="eyebrow mt-10">Account setup</p>
          <h1 className="display mt-4 text-4xl leading-none">Your profile needs review.</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">This signed-in account does not have an active customer, vendor, or admin profile yet. Contact the As-Sābiqūn team so they can verify and activate the correct access.</p>
          <form action={logout} className="mt-7"><button className="btn w-full" type="submit">Sign out</button></form>
        </section>
      </main>
    );
  }

  return <OnboardingFlow role={role} />;
}
