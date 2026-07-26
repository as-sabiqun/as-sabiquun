import { redirect } from "next/navigation";
import { isApprovedVendor, sessionUsesAuthMethod, vendorAccessMessage } from "@/lib/auth";
import { createClient, getCurrentUser, getProfile, isSupabaseConfigured } from "@/lib/supabase/server";
import { VendorSidebar } from "@/components/vendor/vendor-sidebar";

export const metadata = { robots: { index: false, follow: false } };

export default async function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) redirect("/partner-login?error=Partner access is not configured on this deployment.");

  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) {
    redirect("/partner-login?next=/vendor-dashboard");
  }
  const profile = await getProfile(supabase, user.id);
  if (!isApprovedVendor(profile) || !await sessionUsesAuthMethod(supabase, "password")) {
    redirect(`/partner-login?error=${encodeURIComponent(vendorAccessMessage(profile))}`);
  }
  const vendorEmail = user.email ?? "Vendor";
  const vendorName = profile.display_name || vendorEmail.split("@")[0];

  return (
    <div className="vendor-shell">
      <VendorSidebar vendorName={vendorName} vendorEmail={vendorEmail} />
      <div className="vendor-main">
        <header className="vendor-topbar">
          <div className="vendor-topbar-search">
            <span className="vendor-eyebrow">Fulfilment workspace</span>
          </div>
          <div className="vendor-topbar-right">
            <span className="vendor-topbar-badge">Vendor</span>
            <span className="vendor-sidebar-avatar vendor-topbar-avatar">{vendorName.charAt(0)}</span>
          </div>
        </header>
        <main className="vendor-content">{children}</main>
      </div>
    </div>
  );
}
