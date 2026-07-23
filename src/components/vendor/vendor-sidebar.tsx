"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems: { href: string; label: string; icon: () => React.JSX.Element; exact: boolean }[] = [
  { href: "/vendor-dashboard", label: "Dashboard", icon: DashboardIcon, exact: true },
  { href: "/vendor-dashboard/jobs", label: "Jobs", icon: JobsIcon, exact: false },
  { href: "/vendor-dashboard/board", label: "Kanban board", icon: BoardIcon, exact: false },
  { href: "/vendor-dashboard/reports", label: "Reports", icon: ReportIcon, exact: false },
];

function DashboardIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></svg>;
}
function JobsIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></svg>;
}
function BoardIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15 4v16" /></svg>;
}
function ReportIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4" /><circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none" /></svg>;
}
function ProfileIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.6-4.2 5-6 8-6s6.4 1.8 8 6" /></svg>;
}

export function VendorSidebar({ vendorName, vendorEmail }: { vendorName: string; vendorEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="vendor-sidebar">
      <div className="vendor-sidebar-brand">
        <span className="vendor-sidebar-mark">AS</span>
        <div>
          <strong>As-Sābiqūn</strong>
          <small>Vendor Portal</small>
        </div>
      </div>

      <nav className="vendor-sidebar-nav" aria-label="Vendor navigation">
        <span className="vendor-sidebar-heading">Workspace</span>
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
        <Link href="/vendor-dashboard/profile" className={`vendor-sidebar-link ${pathname === "/vendor-dashboard/profile" ? "is-active" : ""}`}>
          <ProfileIcon />
          Profile
        </Link>
        <div className="vendor-sidebar-identity">
          <span className="vendor-sidebar-avatar">{vendorName.charAt(0)}</span>
          <div>
            <strong>{vendorName}</strong>
            <small>{vendorEmail}</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
