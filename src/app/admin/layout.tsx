import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { adminAccessLevel, getActiveAdmin, getAdminMfaState } from "@/lib/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) redirect("/admin/sign-in?error=Admin access is not configured on this deployment.");

  const supabase = await createClient();
  const admin = await getActiveAdmin(supabase);
  if (!admin) redirect("/admin/sign-in?error=Administrator access is required.");

  const mfaState = await getAdminMfaState(supabase);
  if (mfaState === "challenge") redirect("/admin/mfa/challenge");
  if (mfaState === "enroll") redirect("/admin/mfa/enroll");
  if (mfaState !== "verified") redirect("/admin/sign-in?error=We could not verify this administrator session.");

  const adminEmail = admin.user.email ?? "Administrator";
  const adminName = admin.profile.display_name || adminEmail.split("@")[0];

  return (
    <div className="vendor-shell">
      <AdminSidebar adminName={adminName} adminEmail={adminEmail} accessLevel={adminAccessLevel(admin.profile)} />
      <div className="vendor-main">
        <header className="vendor-topbar">
          <form className="vendor-topbar-search" action="/admin/search" role="search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></svg>
            <input name="q" type="search" aria-label="Search jobs, customers, or vendors" placeholder="Search jobs, customers, vendors…" />
          </form>
          <div className="vendor-topbar-right">
            <Link href="/admin/search" className="vendor-topbar-badge">Search</Link>
            <span className="vendor-topbar-badge">MFA secured</span>
            <span className="vendor-sidebar-avatar vendor-topbar-avatar">{adminName.charAt(0)}</span>
          </div>
        </header>
        <main className="vendor-content">{children}</main>
      </div>
    </div>
  );
}
