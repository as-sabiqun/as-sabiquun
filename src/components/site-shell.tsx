import Link from "next/link";
import { Brand } from "@/components/brand";
import { services } from "@/components/service-card";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";

const mainNav = [
  ["About", "/about"],
  ["How it works", "/#how"],
  ["Contact", "/contact"],
] as const;

function ServicesMenu() {
  return (
    <details className="services-menu">
      <summary>Services <span aria-hidden="true">⌄</span></summary>
      <div className="services-menu-panel">
        <div className="services-menu-heading">
          <span>Islamic services</span>
          <Link href="/services">View all <span aria-hidden="true">→</span></Link>
        </div>
        {services.map((service) => (
          <Link key={service.slug} href={service.href}>
            <span className="numeral">{service.number}</span>
            <span><strong>{service.title}</strong><small>{service.description}</small></span>
          </Link>
        ))}
      </div>
    </details>
  );
}

function AccountNavItem({ email }: { email: string | null }) {
  if (!email) {
    return <Link href="/login" className="nav-link">Login</Link>;
  }
  return (
    <form action={logout} className="flex">
      <button type="submit" className="nav-link" title={email}>Log out</button>
    </form>
  );
}

function AccountMobileItem({ email }: { email: string | null }) {
  if (!email) {
    return <Link href="/login">Login</Link>;
  }
  return (
    <form action={logout}>
      <button type="submit">Log out ({email})</button>
    </form>
  );
}

export async function Header() {
  let email: string | null = null;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
  }

  return (
    <header className="site-header">
      <div className="container site-nav-shell flex h-16 items-center justify-between gap-5">
        <Brand compact />
        <nav className="desktop-nav flex items-center gap-1 text-sm font-semibold" aria-label="Main navigation">
          <ServicesMenu />
          {mainNav.map(([label, href]) => (
            <Link key={href} href={href} className="nav-link">{label}</Link>
          ))}
          <AccountNavItem email={email} />
        </nav>
        <div className="desktop-cta">
          <Link className="btn btn-small" href="/services">Choose a service <span aria-hidden="true">→</span></Link>
        </div>
        <details className="mobile-menu">
          <summary aria-label="Open navigation"><span></span><span></span></summary>
          <nav aria-label="Mobile navigation">
            <Link href="/services">All services</Link>
            {services.map((service) => <Link key={service.slug} href={service.href}>{service.title}</Link>)}
            {mainNav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
            <AccountMobileItem email={email} />
          </nav>
        </details>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Brand inverse />
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/60">
              Islamic services coordinated with clarity, human care, and documented fulfilment.
            </p>
            <a className="mt-6 inline-block font-bold text-white" href="tel:+6589933786">+65 8993 3786</a>
          </div>
          <div>
            <p className="footer-heading">Services</p>
            <div className="footer-links">
              {services.map((service) => <Link href={service.href} key={service.slug}>{service.title}</Link>)}
            </div>
          </div>
          <div>
            <p className="footer-heading">As-Sābiqūn</p>
            <div className="footer-links">
              <Link href="/about">About us</Link>
              <Link href="/#how">How it works</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/login">Account login</Link>
            </div>
          </div>
          <div>
            <p className="footer-heading">Socials</p>
            <div className="footer-socials" aria-label="Social media profiles coming soon">
              {['Instagram', 'Facebook', 'TikTok', 'Telegram'].map((social) => (
                <span key={social}>{social}<small>Soon</small></span>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 As-Sābiqūn Association Consultancy</span>
          <span>Preview website · No live transactions</span>
        </div>
      </div>
    </footer>
  );
}
