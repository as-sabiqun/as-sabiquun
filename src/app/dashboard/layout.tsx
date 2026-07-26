import { redirect } from "next/navigation";
import { isGoogleCustomer } from "@/lib/auth";
import { createClient, getProfile, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { robots: { index: false, follow: false } };
import { FloatingReportButton, PortalSidebar } from "./portal-sidebar";
import styles from "./dashboard.module.css";

export default async function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) redirect("/login?error=Customer portal is not configured yet.");

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/dashboard");

  const profile = await getProfile(supabase, data.user.id);
  if (!await isGoogleCustomer(supabase, data.user, profile)) {
    redirect(profile?.status === "suspended" ? "/login?error=This account is suspended." : "/");
  }

  const customerName = profile?.display_name || data.user.email?.split("@")[0] || "Customer";
  const customerEmail = data.user.email ?? "";

  return (
    <div className={styles.portalShell}>
      <PortalSidebar customerName={customerName} customerEmail={customerEmail} />
      <div className={styles.portalMain}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.topbarArabic} lang="ar" dir="rtl">أثر العطاء</span>
            <span className={styles.topbarLabel}>Your giving, kept clear</span>
          </div>
          <div className={styles.topbarIdentity}>
            <span className={styles.topbarName}>{customerName}</span>
            <span className={styles.topbarAvatar}>{customerName.charAt(0).toUpperCase()}</span>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
      <FloatingReportButton />
    </div>
  );
}
