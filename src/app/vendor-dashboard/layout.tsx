import { redirect } from "next/navigation";
import { createClient, getProfile, isSupabaseConfigured } from "@/lib/supabase/server";
import { VendorSidebar } from "@/components/vendor/vendor-sidebar";
import { VendorDataProvider } from "@/components/vendor/vendor-data-context";

export default async function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  let vendorEmail = "vendor@preview.local";
  let vendorName = "Demo Vendor";
  let signedIn = false;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      redirect("/login?next=/vendor-dashboard");
    }
    const profile = await getProfile(supabase, data.user.id);
    if (profile?.role !== "vendor") {
      redirect("/");
    }
    signedIn = true;
    vendorEmail = data.user.email ?? vendorEmail;
    vendorName = profile.display_name || vendorEmail.split("@")[0];
  }

  return (
    <VendorDataProvider>
      <div className="vendor-shell">
        <VendorSidebar vendorName={vendorName} vendorEmail={vendorEmail} />
        <div className="vendor-main">
          <header className="vendor-topbar">
            <div className="vendor-topbar-search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></svg>
              <input type="search" placeholder="Search jobs, orders, references…" />
            </div>
            <div className="vendor-topbar-right">
              {!signedIn && <span className="status">Preview mode</span>}
              <span className="vendor-topbar-badge">Vendor</span>
              <span className="vendor-sidebar-avatar vendor-topbar-avatar">{vendorName.charAt(0)}</span>
            </div>
          </header>
          <main className="vendor-content">{children}</main>
        </div>
      </div>
    </VendorDataProvider>
  );
}
