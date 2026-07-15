import Link from "next/link";
import { Brand } from "@/components/brand";

const nav = [["About", "/about"], ["Korban", "/korban"], ["Wakaf", "/wakaf"], ["Contact", "/contact"]];

export function DemoBar() {
  return <div className="demo-bar">Interactive demonstration · No real payment or service order will be taken</div>;
}

export function Header() {
  return (
    <header className="border-b border-[var(--line)] bg-[rgba(251,246,236,.9)] backdrop-blur-md">
      <div className="container flex h-[82px] items-center justify-between">
        <Brand />
        <nav className="desktop-nav flex items-center gap-8 text-sm font-semibold" aria-label="Main navigation">
          {nav.map(([label, href]) => <Link key={href} href={href} className="hover:text-[var(--teal)]">{label}</Link>)}
        </nav>
        <Link className="btn btn-small" href="/korban">Explore services <span aria-hidden>→</span></Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--teal-dark)] py-14 text-[#d8e9e7]">
      <div className="container grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div><Brand compact /><p className="mt-5 max-w-sm text-sm leading-7 text-[#b9cfcd]">A thoughtful home for Islamic services, responsible technology, and practical business guidance.</p></div>
        <div><p className="mb-4 text-xs font-bold uppercase tracking-[.16em] text-[#d8b16c]">Services</p><div className="grid gap-3 text-sm"><Link href="/korban">Korban</Link><Link href="/wakaf">Wakaf</Link><span>AI consultancy · Soon</span><span>Business consultancy · Soon</span></div></div>
        <div><p className="mb-4 text-xs font-bold uppercase tracking-[.16em] text-[#d8b16c]">Connect</p><div className="grid gap-3 text-sm"><Link href="/about">About us</Link><Link href="/contact">Contact</Link><Link href="/login">Team login</Link></div></div>
      </div>
      <div className="container mt-12 border-t border-white/15 pt-6 text-xs text-[#9db9b6]">© 2026 As-Sābiqūn Association Consultancy · Demonstration website</div>
    </footer>
  );
}
