import Link from "next/link";
import { BrandMark } from "@/components/brand";

const pillars = [
  { n: "01", ar: "الخدمات الإسلامية", title: "Islamic services", text: "Clear, guided access to Korban and Wakaf services with transparent steps and documented fulfilment.", href: "/korban", active: true },
  { n: "02", ar: "الذكاء الاصطناعي", title: "AI consultancy", text: "Practical automation and AI guidance grounded in real operational needs.", active: false },
  { n: "03", ar: "استشارات الأعمال", title: "Business consultancy", text: "Focused support for founders, associations, and teams building with purpose.", active: false },
];

export default function Home() {
  return (
    <>
      <section className="pattern overflow-hidden border-b border-[var(--line)] py-20 md:py-28">
        <div className="container grid items-center gap-14 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <p className="arabic mb-3 text-2xl text-[var(--gold)]" lang="ar" dir="rtl">السَّابِقُونَ</p>
            <h1 className="display max-w-3xl text-[clamp(3.8rem,8vw,7.5rem)] font-semibold leading-[.82] tracking-[-.055em] text-[var(--teal-dark)]">Good work,<br /><em className="font-medium text-[var(--teal)]">made simple.</em></h1>
            <p className="lead mt-8 max-w-xl">One trusted place for Muslims and purpose-led organisations to access Islamic services, responsible AI, and practical business support.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link className="btn" href="/korban">Explore Islamic services <span>→</span></Link><Link className="btn btn-secondary" href="/about">Our purpose</Link></div>
          </div>
          <div className="card relative p-5 shadow-[0_28px_80px_rgba(7,63,70,.12)] md:p-7">
            <div className="mb-8 flex items-center justify-between"><div><p className="eyebrow">Begin with intention</p><h2 className="display mt-2 text-4xl font-semibold">Choose a service</h2></div><BrandMark className="h-16 w-16" /></div>
            <div className="grid gap-3">
              <Link href="/korban" className="group rounded-2xl border border-[var(--line)] bg-white/70 p-5 transition hover:-translate-y-1 hover:border-[var(--teal)]">
                <div className="flex justify-between gap-5"><div><span className="status">Available</span><h3 className="display mt-3 text-3xl font-semibold">Korban</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Arrange a demonstration overseas cow-share service.</p></div><span className="text-2xl text-[var(--gold)]">↗</span></div>
              </Link>
              <Link href="/wakaf" className="group rounded-2xl border border-[var(--line)] bg-white/70 p-5 transition hover:-translate-y-1 hover:border-[var(--teal)]">
                <div className="flex justify-between gap-5"><div><span className="status">Available</span><h3 className="display mt-3 text-3xl font-semibold">Wakaf</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Support education, water, or Quran distribution projects.</p></div><span className="text-2xl text-[var(--gold)]">↗</span></div>
              </Link>
            </div>
            <p className="mt-5 text-center text-xs text-[var(--muted)]">Demo services only · No payment is collected</p>
          </div>
        </div>
      </section>

      <section className="section"><div className="container"><div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]"><div><p className="eyebrow">Three paths, one purpose</p><h2 className="section-title mt-4">Built to help good ideas move.</h2></div><p className="lead max-w-2xl lg:pt-12">As-Sābiqūn brings human guidance and clear digital experiences together. Start with what is available today and see what we are building next.</p></div><div className="mt-14 grid gap-4 md:grid-cols-3">{pillars.map((p) => <article key={p.n} className="card flex min-h-[330px] flex-col p-6"><div className="flex items-start justify-between"><span className="text-xs font-bold text-[var(--gold)]">{p.n}</span>{!p.active && <span className="status">Coming soon</span>}</div><p className="arabic mt-12 text-xl text-[var(--teal)]" lang="ar" dir="rtl">{p.ar}</p><h3 className="display mt-2 text-3xl font-semibold">{p.title}</h3><p className="mt-4 text-sm leading-7 text-[var(--muted)]">{p.text}</p>{p.href && <Link href={p.href} className="mt-auto pt-7 text-sm font-bold text-[var(--teal)]">Explore <span>→</span></Link>}</article>)}</div></div></section>

      <section className="section bg-[var(--teal-dark)] text-white"><div className="container"><p className="eyebrow text-[#d8b16c]">How the service works</p><h2 className="section-title mt-4 max-w-3xl">From intention to documented action.</h2><div className="mt-16 grid gap-10 md:grid-cols-3">{[["١", "Choose clearly", "See the service, amount, and information required before you begin."], ["٢", "We coordinate", "The team reviews the order and assigns it to the appropriate fulfilment partner."], ["٣", "Proof is recorded", "The vendor uploads completion evidence for the team to review and retain."]].map(([n,t,d]) => <div key={n} className="border-t border-white/25 pt-6"><span className="arabic text-4xl text-[#d8b16c]">{n}</span><h3 className="display mt-7 text-3xl font-semibold">{t}</h3><p className="mt-4 text-sm leading-7 text-[#b9cfcd]">{d}</p></div>)}</div></div></section>

      <section className="section"><div className="container grid items-center gap-12 lg:grid-cols-2"><div className="card pattern min-h-[430px] p-8 md:p-12"><p className="arabic text-3xl text-[var(--gold)]" lang="ar">الأمانة</p><p className="display mt-16 max-w-md text-5xl font-semibold leading-[.95] text-[var(--teal-dark)]">Trust is not a badge. It is a process you can see.</p></div><div><p className="eyebrow">Designed for accountability</p><h2 className="section-title mt-4">Clarity at every handoff.</h2><div className="mt-9 grid gap-6">{[["Transparent scope", "The service and demonstration price are shown before any details are submitted."], ["Role-based handling", "Admin and vendor access are separated, with vendors seeing only assigned work."], ["Recorded fulfilment", "Photos and short videos can be attached to the completed service record."]].map(([t,d],i) => <div key={t} className="grid grid-cols-[42px_1fr] gap-4"><span className="display text-2xl text-[var(--gold)]">0{i+1}</span><div><h3 className="font-bold text-[var(--teal-dark)]">{t}</h3><p className="mt-2 text-sm leading-7 text-[var(--muted)]">{d}</p></div></div>)}</div></div></div></section>

      <section className="border-t border-[var(--line)] py-20"><div className="container flex flex-col items-start justify-between gap-8 md:flex-row md:items-end"><div><p className="arabic text-2xl text-[var(--gold)]" lang="ar">اِبْدَأْ بِالنِّيَّة</p><h2 className="section-title mt-3 max-w-3xl">Begin with the service you need.</h2></div><Link className="btn" href="/korban">View services <span>→</span></Link></div></section>
    </>
  );
}
