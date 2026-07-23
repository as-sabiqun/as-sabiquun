import { redirect } from "next/navigation";
import { createClient, getProfile, isSupabaseConfigured } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminDataProvider } from "@/components/admin/admin-data-context";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let adminEmail = "admin@preview.local";
  let adminName = "Demo Admin";
  let signedIn = false;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      redirect("/login?next=/admin");
    }
    const profile = await getProfile(supabase, data.user.id);
    if (profile?.role !== "admin") {
      redirect("/");
    }
    signedIn = true;
    adminEmail = data.user.email ?? adminEmail;
    adminName = profile.display_name || adminEmail.split("@")[0];
  }

  return (
    <AdminDataProvider>
      <div className="vendor-shell">
        <AdminSidebar adminName={adminName} adminEmail={adminEmail} />
        <div className="vendor-main">
          <header className="vendor-topbar">
            <div className="vendor-topbar-search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></svg>
              <input type="search" placeholder="Search jobs, vendors, customers…" />
            </div>
            <div className="vendor-topbar-right">
              {!signedIn && <span className="status">Preview mode</span>}
              <span className="vendor-topbar-badge">Admin</span>
              <span className="vendor-sidebar-avatar vendor-topbar-avatar">{adminName.charAt(0)}</span>
            </div>
          </header>
          <main className="vendor-content">{children}</main>
        </div>
      </div>
    </AdminDataProvider>
  );
}
