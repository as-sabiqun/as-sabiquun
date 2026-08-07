import Link from "next/link";
import { Brand } from "@/components/brand";
import { catalogServicesFrom } from "@/components/service-card";
import { getActiveOfferings } from "@/lib/offerings";

const mainNav = [
  ["About", "/about"],
  ["How it works", "/#how"],
  ["Contact", "/contact"],
] as const;

export async function Header() {
  const services = catalogServicesFrom(await getActiveOfferings());
  return (
    <header className="site-header">
      <div className="container site-nav-shell flex h-16 items-center justify-between gap-5">
        <Brand compact />
        <nav className="desktop-nav flex items-center gap-1 text-sm font-semibold" aria-label="Main navigation">
          <Link href="/services" className="nav-link">Services</Link>
          {mainNav.map(([label, href]) => <Link key={href} href={href} className="nav-link">{label}</Link>)}
          <Link href="/login" className="nav-link">Login</Link>
        </nav>
        <div className="desktop-cta">
          <Link className="btn btn-small" href="/services">Pick a service <span aria-hidden="true">→</span></Link>
        </div>
        <details className="mobile-menu">
          <summary aria-label="Open navigation"><span /><span /></summary>
          <nav aria-label="Mobile navigation">
            <Link href="/services">All services</Link>
            {services.map((service) => <Link key={service.slug} href={service.href}>{service.title}</Link>)}
            {mainNav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
            <Link href="/login">Login</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export async function Footer() {
  const services = catalogServicesFrom(await getActiveOfferings());
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Brand inverse />
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/60">
              Choose an Islamic service. We arrange the work and send you proof when it is done.
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
            <p className="footer-heading">As-Sabiqun</p>
            <div className="footer-links">
              <Link href="/about">About us</Link>
              <Link href="/#how">How it works</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/login">Customer login</Link>
              <Link href="/partner-login">Partner login</Link>
            </div>
          </div>
          <div>
            <p className="footer-heading">Socials</p>
            <div className="footer-socials" aria-label="Social media profiles coming soon">
              {["Instagram", "Facebook", "TikTok", "Telegram"].map((social) => (
                <span key={social}>{social}<small>Soon</small></span>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 As-Sabiqun Association Consultancy</span>
          <span>Islamic services with clear proof of completion</span>
        </div>
      </div>
    </footer>
  );
}
