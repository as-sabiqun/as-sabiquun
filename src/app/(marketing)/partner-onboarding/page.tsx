import { redirect } from "next/navigation";
import { sessionUsesAuthMethod } from "@/lib/auth";
import { createClient, getCurrentUser, getProfile } from "@/lib/supabase/server";
import { PartnerOnboardingForm } from "./form";

export default async function PartnerOnboardingPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) redirect("/partner-login?error=Open the secure invitation link before onboarding.");
  const profile = await getProfile(supabase, user.id);
  if (await sessionUsesAuthMethod(supabase, "oauth") || profile?.role !== "vendor" || profile.vendor_onboarding_status !== "invited") {
    redirect(profile?.vendor_onboarding_status === "approved" ? "/vendor-dashboard" : "/partner-login?message=This partner account is already awaiting review.");
  }

  return (
    <section className="partner-onboarding-shell">
      <div className="container partner-onboarding-wrap">
        <header className="partner-onboarding-head">
          <p lang="ar" dir="rtl">أَهْلًا وَسَهْلًا</p>
          <span>Fulfilment partner onboarding</span>
          <h1>Complete your operating profile.</h1>
          <p>Your password is set. Add the details the operations team needs to approve assignments and record settlement correctly.</p>
        </header>
        <PartnerOnboardingForm initialName={profile.display_name === "Customer" ? "" : profile.display_name} />
      </div>
    </section>
  );
}
