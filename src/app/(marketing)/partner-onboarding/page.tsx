import { BriefcaseBusiness, Building2, Check, Landmark, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { sessionUsesAuthMethod } from "@/lib/auth";
import { safeVendorRedirectPath } from "@/lib/auth-redirect";
import { createClient, getCurrentUser, getProfile } from "@/lib/supabase/server";
import { PartnerOnboardingForm } from "./form";
import styles from "./partner-onboarding.module.css";

export default async function PartnerOnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeVendorRedirectPath((await searchParams).next);
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) redirect(`/partner-login?${new URLSearchParams({ error: "Open the secure invitation link before onboarding.", next }).toString()}`);
  const profile = await getProfile(supabase, user.id);
  if (await sessionUsesAuthMethod(supabase, "oauth") || profile?.role !== "vendor" || profile.vendor_onboarding_status !== "invited") {
    redirect(profile?.vendor_onboarding_status === "approved" ? next : `/partner-login?${new URLSearchParams({ message: "This partner account is already awaiting review.", next }).toString()}`);
  }

  return <PartnerOnboardingSurface initialName={profile.display_name === "Customer" ? "" : profile.display_name} next={next} />;
}

function PartnerOnboardingSurface({ initialName, next }: { initialName: string; next: string }) {
  return (
    <section
      className={styles.shell}
      aria-labelledby="onboarding-title"
      data-design-contract="THESIS: partner onboarding is one accountable operating record, not a generic form stack. OWN-WORLD: cream register, deep-navy approval route, cobalt action, green invitation state, Newsreader purpose and Inter facts. STORY: identify the organisation, declare service capability, provide settlement details, submit for approval. FIRST VIEWPORT: purpose and first record dominate while the route remains visible. FORM: operating profile register, grounded structure 3, seed eebac684, approved comp partner-onboarding-a-register. FINISH: responsive QA, detector, independent review, and documentation are required before push."
    >
      <div className={styles.frame}>
        <div className={styles.register}>
          <header className={styles.intro}>
            <h1 id="onboarding-title">Complete your operating profile.</h1>
            <p>Your password is set. Add the organisation, service, and settlement details our team needs before your partner account can be approved.</p>
            <div className={styles.recordNote}>
              <ShieldCheck aria-hidden="true" />
              <span>All three sections are required. Settlement details are visible only to authorised staff.</span>
            </div>
          </header>
          <PartnerOnboardingForm initialName={initialName} next={next} />
        </div>

        <aside className={styles.route} aria-labelledby="approval-route-title">
          <div className={styles.routeInner}>
            <div className={styles.invitationState}>
              <span aria-hidden="true"><Check /></span>
              <div><strong>Invitation confirmed</strong><small>Your partner access is ready to be configured.</small></div>
            </div>
            <h2 id="approval-route-title">Your approval route</h2>
            <p className={styles.routeLead}>Complete one operating record across three connected sections.</p>
            <ol className={styles.routeSteps}>
              <li><span className={styles.routeIcon} aria-hidden="true"><Building2 /></span><div><small>01</small><strong>Organisation</strong><p>Who we will coordinate with.</p></div></li>
              <li><span className={styles.routeIcon} aria-hidden="true"><BriefcaseBusiness /></span><div><small>02</small><strong>Capability</strong><p>Which services you can fulfil.</p></div></li>
              <li><span className={styles.routeIcon} aria-hidden="true"><Landmark /></span><div><small>03</small><strong>Settlement</strong><p>Where approved payments are recorded.</p></div></li>
            </ol>
            <div className={styles.afterSubmit}>
              <strong>After you submit</strong>
              <p>You will be signed out while the profile awaits administrator approval. Once approved, sign in again to continue.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
