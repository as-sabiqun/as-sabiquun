import Link from "next/link";
import { BrandMark } from "@/components/brand";

const pillars = [
  { n: "01", ar: "الخدمات الإسلامية", title: "Islamic services", text: "Guided access to Korban and Wakaf, with transparent steps and documented fulfilment.", href: "/korban", active: true },
  { n: "02", ar: "الذكاء الاصطناعي", title: "AI consultancy", text: "Practical automation and AI guidance grounded in real operational needs.", active: false },
  { n: "03", ar: "استشارات الأعمال", title: "Business consultancy", text: "Focused support for founders, associations, and teams building with purpose.", active: false },
];

const steps = [
  ["01", "Choose clearly", "See the service, amount, and information required before you begin."],
  ["02", "We coordinate", "The team reviews the order and assigns it to the appropriate fulfilment partner."],
  ["03", "Proof is recorded", "The vendor uploads completion evidence for the team to review and retain."],
];

const trust = [
  ["Transparent scope", "The service and demonstration price are shown before any details are submitted."],
  ["Role-based handling", "Admin and vendor access are separated, with vendors seeing only assigned work."],
  ["Recorded fulfilment", "Photos and short videos can be attached to the completed service record."],
];

export default function Home() {
  return (
    <>
      <section className="border-b border-[var(--line)] py-20 md:py-28">
        <div className="container grid items-center gap-14 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="eyebrow">Islamic services · Association consultancy</p>
            <h1 className="display mt-6 max-w-2xl text-[clamp(2.8rem,6.4vw,5.4rem)] leading-[.94]">
              Good work,<br />made <span className="text-[var(--teal)]">legible.</span>
            </h1>
            <p className="lead mt-7 max-w-lg">One trusted place for Muslims and purpose-led organisations to access Islamic services, responsible AI, and practical business support.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link className="btn" href="/korban">Explore Islamic services <span>→</span></Link>
              <Link className="btn btn-secondary" href="/about">Our purpose</Link>
            </div>
            <div className="mt-11 flex flex-wrap gap-x-8 gap-y-2 border-t border-[var(--line)] pt-6 text-xs font-bold uppercase tracking-[.1em] text-[var(--muted)]">
              <span>Transparent scope</span><span>Human coordination</span><span>Recorded proof</span>
            </div>
          </div>

          <div className="card relative overflow-hidden p-2">
            <div className="rounded-[12px] bg-[var(--teal-dark)] p-6 text-white md:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[.68rem] font-bold uppercase tracking-[.14em] text-[#89b39c]">Begin with intention</p>
                  <h2 className="display mt-2 text-3xl">Choose a service</h2>
                </div>
                <BrandMark className="h-11 w-11" />
              </div>
              <div className="mt-7 grid gap-3">
                <Link href="/korban" className="group rounded-[10px] border border-white/12 bg-white/[.04] p-5 transition hover:border-white/30 hover:bg-white/[.08]">
                  <div className="flex justify-between gap-5">
                    <div>
                      <span className="status">Available</span>
                      <h3 className="display mt-3 text-2xl">Korban</h3>
                      <p className="mt-2 text-sm leading-6 text-[#a9c3b4]">Arrange a demonstration overseas cow-share service.</p>
                    </div>
                    <span className="mt-1 text-lg text-white transition group-hover:translate-x-1">↗</span>
                  </div>
                </Link>
                <Link href="/wakaf" className="group rounded-[10px] border border-white/12 bg-white/[.04] p-5 transition hover:border-white/30 hover:bg-white/[.08]">
                  <div className="flex justify-between gap-5">
                    <div>
                      <span className="status">Available</span>
                      <h3 className="display mt-3 text-2xl">Wakaf</h3>
                      <p className="mt-2 text-sm leading-6 text-[#a9c3b4]">Support education, water, or Quran distribution projects.</p>
                    </div>
                    <span className="mt-1 text-lg text-white transition group-hover:translate-x-1">↗</span>
                  </div>
                </Link>
              </div>
            </div>
            <p className="p-4 text-center text-xs text-[var(--muted)]">Demo services only · No payment is collected</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <p className="eyebrow">Three paths, one purpose</p>
              <h2 className="section-title mt-4">Built to help good ideas move.</h2>
            </div>
            <p className="lead max-w-2xl lg:pt-3">As-Sābiqūn brings human guidance and clear digital experiences together. Start with what is available today and see what we are building next.</p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {pillars.map((p) => (
              <article key={p.n} className="card flex min-h-[300px] flex-col p-6">
                <div className="flex items-start justify-between">
                  <span className="numeral text-xs text-[var(--muted)]">{p.n}</span>
                  {!p.active && <span className="status">Coming soon</span>}
                </div>
                <p className="arabic mt-10 text-lg text-[var(--muted)]" lang="ar" dir="rtl">{p.ar}</p>
                <h3 className="display mt-2 text-2xl">{p.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{p.text}</p>
                {p.href && <Link href={p.href} className="mt-auto pt-7 text-sm font-bold text-[var(--teal)]">Explore <span>→</span></Link>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-[var(--teal-dark)] text-white">
        <div className="container">
          <p className="eyebrow"><span className="text-[#e6a37a]">How the service works</span></p>
          <h2 className="section-title mt-4 max-w-3xl">From intention to documented action.</h2>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {steps.map(([n, t, d]) => (
              <div key={n} className="border-t border-white/20 pt-6">
                <span className="numeral text-3xl text-[#89b39c]">{n}</span>
                <h3 className="display mt-6 text-2xl">{t}</h3>
                <p className="mt-4 text-sm leading-7 text-[#a9c3b4]">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <div className="card flex min-h-[400px] flex-col justify-between p-8 md:p-10">
            <p className="eyebrow">Trust, made visible</p>
            <p className="display max-w-md text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.05]">Trust is not a badge. It is a process you can see.</p>
          </div>
          <div>
            <p className="eyebrow">Designed for accountability</p>
            <h2 className="section-title mt-4">Clarity at every handoff.</h2>
            <div className="mt-9 grid gap-6">
              {trust.map(([t, d], i) => (
                <div key={t} className="grid grid-cols-[38px_1fr] gap-4">
                  <span className="numeral text-xl text-[var(--teal)]">0{i + 1}</span>
                  <div>
                    <h3 className="font-bold text-[var(--ink)]">{t}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-20">
        <div className="container flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Begin with intention</p>
            <h2 className="section-title mt-3 max-w-3xl">Begin with the service you need.</h2>
          </div>
          <Link className="btn" href="/korban">View services <span>→</span></Link>
        </div>
      </section>
    </>
  );
}
