"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems: { href: string; label: string; icon: () => React.JSX.Element; exact: boolean }[] = [
  { href: "/admin", label: "Pending jobs", icon: JobsIcon, exact: true },
  { href: "/admin/vendors", label: "Vendors", icon: VendorsIcon, exact: false },
  { href: "/admin/customers", label: "Customers", icon: CustomersIcon, exact: false },
  { href: "/admin/reports", label: "Reports", icon: ReportIcon, exact: false },
];

function JobsIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></svg>;
}
function VendorsIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="10" width="7" height="11" rx="1.2" /><rect x="14" y="4" width="7" height="17" rx="1.2" /><path d="M6 14h1M6 17h1M17 8h1M17 11h1M17 14h1" /></svg>;
}
function CustomersIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1.2-4 4-6 6.5-6s5.3 2 6.5 6" /><circle cx="18" cy="8" r="2.6" /><path d="M15.5 14.3c2.4.4 4.1 2.2 5 5.7" /></svg>;
}
function ReportIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4" /><circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none" /></svg>;
}
function ProfileIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.6-4.2 5-6 8-6s6.4 1.8 8 6" /></svg>;
}

export function AdminSidebar({ adminName, adminEmail }: { adminName: string; adminEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="vendor-sidebar admin-sidebar">
      <div className="vendor-sidebar-brand">
        <span className="vendor-sidebar-mark">AS</span>
        <div>
          <strong>As-Sābiqūn</strong>
          <small>Admin Console</small>
        </div>
      </div>

      <nav className="vendor-sidebar-nav" aria-label="Admin navigation">
        <span className="vendor-sidebar-heading">Operations</span>
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className={`vendor-sidebar-link ${isActive ? "is-active" : ""}`}>
              <Icon />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="vendor-sidebar-profile">
        <Link href="/admin/profile" className={`vendor-sidebar-link ${pathname === "/admin/profile" ? "is-active" : ""}`}>
          <ProfileIcon />
          Profile
        </Link>
        <div className="vendor-sidebar-identity">
          <span className="vendor-sidebar-avatar">{adminName.charAt(0)}</span>
          <div>
            <strong>{adminName}</strong>
            <small>{adminEmail}</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
