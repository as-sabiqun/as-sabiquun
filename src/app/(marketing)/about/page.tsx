import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return <>
    <section className="pattern border-b border-[var(--line)] py-24"><div className="container max-w-5xl"><p className="arabic text-3xl text-[var(--gold)]" lang="ar">مَنْ نَحْنُ</p><h1 className="display mt-5 text-[clamp(4rem,9vw,8rem)] font-semibold leading-[.85] tracking-[-.05em] text-[var(--teal-dark)]">Purpose before platform.</h1><p className="lead mt-8 max-w-2xl">As-Sābiqūn Association Consultancy is being shaped as a single, thoughtful home for services that help Muslim communities and purpose-led organisations move forward.</p></div></section>
    <section className="section"><div className="container grid gap-14 lg:grid-cols-[.8fr_1.2fr]"><div><p className="eyebrow">Why we exist</p><h2 className="section-title mt-4">Make valuable help easier to reach.</h2></div><div className="prose"><p>Important services often feel scattered across forms, messages, payment links, and manual follow-up. Our role is to make the journey clearer without removing the human judgment that responsible service requires.</p><p>We begin with Korban and Wakaf, supported by a transparent operational workflow. AI and business consultancy will follow when their service models are ready.</p><h2>Our working principles</h2><div className="grid gap-4 sm:grid-cols-2">{[["Clarity", "Say what happens, who handles it, and what comes next."], ["Amanah", "Treat personal information, funds, and fulfilment evidence responsibly."], ["Practicality", "Use technology where it removes friction, not where it adds theatre."], ["Progress", "Start focused, learn from real use, then improve with care."]].map(([t,d]) => <div className="card p-5" key={t}><h3 className="font-bold text-[var(--teal-dark)]">{t}</h3><p className="!mb-0 mt-2 text-sm">{d}</p></div>)}</div></div></div></section>
    <section className="section bg-[var(--teal-soft)]"><div className="container flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="eyebrow">The first chapter</p><h2 className="section-title mt-4 max-w-2xl">Islamic services, made easier to coordinate.</h2></div><Link href="/korban" className="btn">Explore the demo <span>→</span></Link></div></section>
  </>;
}
