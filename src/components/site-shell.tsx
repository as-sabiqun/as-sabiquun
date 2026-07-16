import Link from "next/link";
import { Brand } from "@/components/brand";

const nav = [["About", "/about"], ["Korban", "/korban"], ["Wakaf", "/wakaf"], ["Contact", "/contact"]];

export function DemoBar() {
  return <div className="demo-bar">Interactive demonstration · No real payment or service order will be taken</div>;
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(246,245,241,.88)] backdrop-blur-md">
      <div className="container flex h-[72px] items-center justify-between">
        <Brand />
        <nav className="desktop-nav flex items-center gap-1 text-sm font-semibold" aria-label="Main navigation">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-md px-3 py-2 text-[var(--muted)] transition hover:bg-[var(--cream-dark)] hover:text-[var(--ink)]">
              {label}
            </Link>
          ))}
        </nav>
        <Link className="btn btn-small" href="/korban">Explore services</Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--teal-dark)] py-14 text-[#cfe0d5]">
      <div className="container grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-[8px] bg-[var(--cream)] text-[var(--ink)]">
              <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden><path d="M20 8 22.2 16.4 30.5 14.2 24.6 20.4 30.5 26.6 22.2 24.4 20 32.8 17.8 24.4 9.5 26.6 15.4 20.4 9.5 14.2 17.8 16.4Z" fill="currentColor" /></svg>
            </span>
            <strong className="display block text-lg text-white">As-Sābiqūn</strong>
          </span>
          <p className="mt-5 max-w-sm text-sm leading-7 text-[#a9c3b4]">A thoughtful home for Islamic services, responsible technology, and practical business guidance.</p>
        </div>
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[.16em] text-[#7fa891]">Services</p>
          <div className="grid gap-3 text-sm"><Link href="/korban">Korban</Link><Link href="/wakaf">Wakaf</Link><span className="text-[#7fa891]">AI consultancy · Soon</span><span className="text-[#7fa891]">Business consultancy · Soon</span></div>
        </div>
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[.16em] text-[#7fa891]">Connect</p>
          <div className="grid gap-3 text-sm"><Link href="/about">About us</Link><Link href="/contact">Contact</Link><Link href="/login">Team login</Link></div>
        </div>
      </div>
      <div className="container mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-[#82a190] sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 As-Sābiqūn Association Consultancy</span>
        <span>Demonstration website · No live transactions</span>
      </div>
    </footer>
  );
}
