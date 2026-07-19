import Link from "next/link";
import { Brand } from "@/components/brand";
import { services } from "@/components/service-card";

const mainNav = [
  ["About", "/about"],
  ["How it works", "/#how-it-works"],
  ["Contact", "/contact"],
] as const;

export function DemoBar() {
  return (
    <div className="demo-bar">
      <div className="container flex items-center justify-center gap-5 sm:justify-between">
        <span>Website preview · Services and payments are not yet live</span>
        <a className="hidden sm:inline" href="tel:+6589933786">+65 8993 3786</a>
      </div>
    </div>
  );
}

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
            <span><strong>{service.title}</strong><small>{service.arabic}</small></span>
          </Link>
        ))}
      </div>
    </details>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <div className="container flex h-[78px] items-center justify-between gap-5">
        <Brand />
        <nav className="desktop-nav flex items-center gap-1 text-sm font-semibold" aria-label="Main navigation">
          <ServicesMenu />
          {mainNav.map(([label, href]) => (
            <Link key={href} href={href} className="nav-link">{label}</Link>
          ))}
        </nav>
        <div className="desktop-cta">
          <Link className="btn btn-small" href="/services">Explore services <span aria-hidden="true">→</span></Link>
        </div>
        <details className="mobile-menu">
          <summary aria-label="Open navigation"><span></span><span></span></summary>
          <nav aria-label="Mobile navigation">
            <Link href="/services">All services</Link>
            {services.map((service) => <Link key={service.slug} href={service.href}>{service.title}</Link>)}
            {mainNav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
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
              <Link href="/#how-it-works">How it works</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/login">Team login</Link>
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
