"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, House, LifeBuoy, LogOut, Rows3, UserRound } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand";
import styles from "./dashboard.module.css";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: House, exact: true },
  { href: "/dashboard/projects", label: "Projects", icon: Rows3, exact: false },
  { href: "/dashboard/report", label: "Support", icon: LifeBuoy, exact: false },
  { href: "/dashboard/account", label: "Account", icon: UserRound, exact: false },
] as const;

export function PortalSidebar({ customerName, customerEmail }: { customerName: string; customerEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.brand} aria-label="As-Sābiqūn home">
        <span className={styles.brandSeal}><BrandMark className="h-10 w-10" priority /></span>
        <span>
          <strong>As-Sābiqūn</strong>
          <small>My giving portal</small>
        </span>
      </Link>

      <nav className={styles.navigation} aria-label="Customer portal navigation">
        <span className={styles.navHeading}>Your space</span>
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const cleanHref = href.split("#")[0];
          const isActive = exact ? pathname === cleanHref && href === "/dashboard" : pathname.startsWith(cleanHref);
          return (
            <Link key={href} href={href} className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarBottom}>
        <Link href="/services" className={styles.browseLink}>
          Browse services <ExternalLink aria-hidden="true" />
        </Link>
        <div className={styles.identity}>
          <span className={styles.avatar}>{customerName.charAt(0).toUpperCase()}</span>
          <span className={styles.identityCopy}>
            <strong>{customerName}</strong>
            <small>{customerEmail}</small>
          </span>
        </div>
        <form action={logout}>
          <button type="submit" className={styles.logoutButton}>
            <LogOut aria-hidden="true" /> Log out
          </button>
        </form>
      </div>
    </aside>
  );
}

export function FloatingReportButton() {
  const pathname = usePathname();
  if (pathname === "/dashboard/report") return null;

  return (
    <Link href="/dashboard/report" className={styles.reportButton}>
      <LifeBuoy aria-hidden="true" />
      <span>Report a concern</span>
    </Link>
  );
}
