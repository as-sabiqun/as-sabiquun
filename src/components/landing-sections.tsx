import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown, HandHeart, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { services } from "@/components/service-card";
import { Reveal } from "@/components/landing-reveal";
import { LandingMobileMenu, ThemeToggle } from "@/components/landing-theme";

const NAV_LINKS = [
  { label: "Services", href: "/services" },
  { label: "Korban", href: "/korban" },
  { label: "Wakaf", href: "/wakaf" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function SectionEyebrow({ arabic, english }: { arabic: string; english: string }) {
  return (
    <div className="mb-6 inline-flex items-center gap-3">
      <span className="lp-arabic text-[18px] font-medium leading-none" style={{ color: "var(--lp-gold)" }}>{arabic}</span>
      <span className="h-3 w-px" style={{ backgroundColor: "rgba(var(--lp-gold-rgb),0.4)" }} />
      <span className="text-[10px] font-bold uppercase tracking-[0.32em]" style={{ color: "var(--lp-gold)", opacity: 0.85 }}>{english}</span>
    </div>
  );
}

function KhatimTexture({ color = "var(--gold)", opacity = 0.06 }: { color?: string; opacity?: number }) {
  const id = `khatim-${color.replace(/[^a-z0-9]/gi, "")}-${Math.round(opacity * 100)}`;
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity }}>
      <defs>
        <pattern id={id} x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={color} strokeWidth="0.9">
            <rect x="12" y="12" width="24" height="24" />
            <rect x="12" y="12" width="24" height="24" transform="rotate(45 24 24)" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function LandingNav() {
  return (
    <nav className="fixed inset-x-0 top-3 z-50 px-4 lg:px-6">
      <div className="lp-nav relative mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-full py-2 pl-3 pr-2 shadow-[0_10px_0_-6px_rgba(var(--lp-teal-dark-rgb),0.1)]">
        <Link href="/" className="flex shrink-0 items-center gap-2 transition-transform hover:scale-[1.02]" aria-label="As-Sabiqun home">
          <BrandMark className="h-8 w-8 shrink-0" />
          <span className="lp-display text-[19px] font-semibold tracking-tight" style={{ color: "var(--lp-gold)" }}>As-Sabiqun</span>
        </Link>
        <div className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-black/5" style={{ color: "var(--lp-text)" }}>{l.label}</Link>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link href="/login" className="hidden items-center rounded-full px-4 py-2 text-[13px] font-semibold whitespace-nowrap transition-transform hover:scale-[1.03] sm:inline-flex" style={{ color: "var(--lp-emerald)", border: "1px solid var(--lp-border)" }}>
            Log in
          </Link>
          <Link href="/services" className="lp-pill flex items-center gap-1.5 rounded-full py-2 pl-4 pr-3 text-[13px] font-semibold whitespace-nowrap transition-transform hover:scale-[1.03]">
            Choose a service
            <ArrowUpRight size={14} strokeWidth={2.5} />
          </Link>
          <LandingMobileMenu links={NAV_LINKS} />
        </div>
      </div>
    </nav>
  );
}

export function Hero() {
  return (
    <section className="lp-hero-canvas relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden="true">
        <span className="lp-orb" style={{ left: "12%", top: "20%", width: 340, height: 340, background: "radial-gradient(circle, rgba(var(--lp-gold-rgb),0.30) 0%, transparent 70%)" }} />
        <span className="lp-orb lp-orb-b" style={{ right: "8%", top: "30%", width: 300, height: 300, background: "radial-gradient(circle, rgba(var(--lp-teal-dark-rgb),0.18) 0%, transparent 70%)" }} />
        <span className="lp-orb lp-orb-c" style={{ left: "40%", bottom: "6%", width: 380, height: 380, background: "radial-gradient(circle, rgba(var(--lp-gold-rgb),0.22) 0%, transparent 70%)" }} />
      </div>
      <KhatimTexture opacity={0.05} />
      <div className="lp-grain pointer-events-none absolute inset-0 z-[3]" aria-hidden="true" />

      <LandingNav />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="lp-arabic mb-4 text-2xl" style={{ color: "var(--lp-gold)" }} lang="ar" dir="rtl">بِالْأَمَانَةِ وَالْإِحْسَانِ</p>
        <h1 className="lp-display max-w-2xl font-medium" style={{ fontSize: "clamp(40px, 6.5vw, 76px)", lineHeight: 1, color: "var(--lp-emerald)", textShadow: "0 2px 18px rgba(var(--lp-cream-rgb),0.45)" }}>
          Islamic services,{" "}
          <em className="lp-display font-medium" style={{ color: "var(--lp-gold)" }}>clearly carried through.</em>
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-[16px] font-medium leading-relaxed lg:text-[17px]" style={{ color: "var(--lp-text)", textShadow: "0 1px 12px rgba(var(--lp-cream-rgb),0.5)" }}>
          Choose a service, review its scope, and follow every handoff from your request to the completion record.
        </p>
        <div className="mt-8 flex items-center justify-center">
          <Link href="/services" className="lp-pill flex items-center gap-3 rounded-full py-2 pl-6 pr-2 transition-transform hover:scale-105 active:scale-95">
            <span className="text-[16px] font-semibold">Choose a service</span>
            <span className="grid h-9 w-9 place-items-center rounded-full" style={{ backgroundColor: "rgba(var(--lp-gold-rgb),0.3)" }}>
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </span>
          </Link>
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--lp-text-muted)" }}>Website preview - no live payments are being accepted</p>
      </div>

      <a href="#record" className="relative z-10 mx-auto mb-7 flex flex-col items-center" aria-label="Scroll down">
        <ChevronDown size={20} className="animate-bounce" style={{ color: "var(--lp-gold)" }} />
      </a>
    </section>
  );
}

export function AmanahShowcase() {
  const recordSteps = [
    { label: "Intention recorded", state: "complete" as const },
    { label: "Team review", state: "complete" as const },
    { label: "Partner fulfilment", state: "current" as const },
    { label: "Reviewed proof", state: "pending" as const },
  ];
  return (
    <section id="record" className="relative overflow-hidden px-6 py-24 lg:px-10 lg:py-32" style={{ backgroundColor: "var(--lp-bg-alt)", color: "var(--lp-text)" }}>
      <KhatimTexture color="var(--lp-gold)" opacity={0.05} />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <div className="mb-6 inline-flex items-center gap-3">
            <span className="lp-arabic text-[18px] font-medium leading-none" style={{ color: "var(--lp-gold)" }}>اُنْظُرْ</span>
            <span className="h-3 w-px" style={{ backgroundColor: "rgba(var(--lp-gold-rgb),0.4)" }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.32em]" style={{ color: "var(--lp-gold)" }}>See a live record</span>
          </div>
          <h2 className="lp-display font-medium" style={{ fontSize: "clamp(32px, 4.5vw, 50px)", lineHeight: 1.06 }}>
            You don&apos;t just place an order.{" "}
            <em className="lp-display font-medium" style={{ color: "var(--lp-gold)" }}>You follow it.</em>
          </h2>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed" style={{ color: "var(--lp-text-muted)" }}>
            Every service becomes an amanah record - reference, status, and completion evidence kept together from the moment you submit a request to the day it&apos;s fulfilled.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {["Ordered", "Reviewed", "Assigned", "Documented"].map((s, i) => (
              <span key={s} className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-wide" style={{ backgroundColor: "var(--lp-gold-soft)", color: "var(--lp-gold)", border: "1px solid var(--lp-border)" }}>
                <span className="opacity-60">{i + 1}</span> {s}
              </span>
            ))}
          </div>
          <div className="mt-9">
            <Link href="/korban" className="lp-pill inline-flex items-center gap-3 rounded-full py-2 pl-5 pr-2 transition-transform hover:scale-105 active:scale-95">
              <span className="text-[15px] font-semibold">See how it works</span>
              <span className="grid h-9 w-9 place-items-center rounded-full" style={{ backgroundColor: "rgba(var(--lp-gold-rgb),0.3)" }}>
                <ArrowUpRight size={16} strokeWidth={2.5} />
              </span>
            </Link>
          </div>
        </Reveal>
        <Reveal delay={120} className="lp-panel-dark rounded-[1.6rem] p-6 md:p-7">
          <div className="flex items-center justify-between border-b pb-5" style={{ borderColor: "rgba(var(--lp-cream-rgb),.14)" }}>
            <div>
              <p className="text-[.68rem] font-black uppercase tracking-[.16em]" style={{ color: "var(--lp-text-muted)" }}>Example amanah record</p>
              <h3 className="lp-display mt-1 text-xl">Wakaf Quran</h3>
              <p className="lp-arabic mt-1 text-lg" style={{ color: "var(--lp-gold)" }} lang="ar" dir="rtl">وقف القرآن</p>
            </div>
            <span className="rounded-full px-3 py-2 text-[.65rem] font-black" style={{ backgroundColor: "rgba(var(--lp-gold-rgb),0.22)", color: "var(--lp-gold)" }}>In fulfilment</span>
          </div>
          <ol className="mt-5 space-y-1">
            {recordSteps.map((step) => (
              <li key={step.label} className="grid grid-cols-[26px_1fr_auto] items-center gap-3 rounded-xl px-2 py-2.5" style={step.state === "current" ? { backgroundColor: "rgba(var(--lp-cream-rgb),.06)" } : undefined}>
                <span
                  className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-black"
                  style={
                    step.state === "complete"
                      ? { backgroundColor: "var(--lp-gold)", color: "var(--lp-emerald)" }
                      : step.state === "current"
                        ? { border: "1px solid var(--lp-gold)", color: "var(--lp-gold)" }
                        : { border: "1px solid rgba(var(--lp-cream-rgb),.2)", color: "rgba(var(--lp-cream-rgb),.4)" }
                  }
                >
                  {step.state === "complete" ? "✓" : ""}
                </span>
                <span className="text-sm font-semibold">{step.label}</span>
                <span className="text-[.68rem] font-bold" style={{ color: "var(--lp-text-muted)" }}>
                  {step.state === "complete" ? "Done" : step.state === "current" ? "Current" : "Next"}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs leading-6" style={{ color: "var(--lp-text-muted)" }}>Illustrative record - no live order has been created.</p>
        </Reveal>
      </div>
    </section>
  );
}

export function StatsBar() {
  const stats = [
    { num: "4", label: "Services", sub: "korban and wakaf" },
    { num: "100%", label: "Documented proof", sub: "reviewed before release" },
    { num: "24h", label: "Response window", sub: "for assignment" },
    { num: "2", label: "Fulfilment partners", sub: "and growing" },
  ];
  return (
    <section className="relative border-y px-6 py-10 lg:px-10 lg:py-14" style={{ borderColor: "var(--lp-border)", backgroundColor: "var(--lp-bg-deep)" }}>
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-10">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 90} className="text-center lg:text-left">
            <div className="lp-display mb-2 text-[44px] font-medium leading-none lg:text-[56px]" style={{ color: "var(--lp-gold)" }}>{s.num}</div>
            <div className="lp-display text-[14px] font-medium leading-snug" style={{ color: "var(--lp-text)" }}>{s.label}</div>
            <div className="mt-1 text-[11px]" style={{ color: "var(--lp-text-muted)" }}>{s.sub}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function WhyDifferent() {
  const pillars = [
    { arabicTitle: "الوُضُوح", title: "Clear scope, first", body: "See the service, the demonstration price, and what's included before you share a single detail. No surprises between request and receipt.", icon: <Sparkles size={22} style={{ color: "var(--lp-gold)" }} />, tags: ["Scope upfront", "No hidden steps"] },
    { arabicTitle: "الأَمَانَة", title: "Human coordination", body: "A team reviews every request and manages the handoff to a fulfilment partner - your order is never just a queue position.", icon: <HandHeart size={22} style={{ color: "var(--lp-gold)" }} />, tags: ["Reviewed by people", "Assigned, not automated"] },
    { arabicTitle: "الإِحْسَان", title: "Documented proof", body: "Available photos or video are reviewed before they're returned to you, so completion means something you can actually see.", icon: <ShieldCheck size={22} style={{ color: "var(--lp-gold)" }} />, tags: ["Reviewed evidence", "Kept with your order"] },
  ];
  return (
    <section id="why" className="relative px-6 py-24 lg:px-10 lg:py-36">
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow arabic="لِمَاذَا" english="Why As-Sabiqun" />
        <h2 className="lp-display max-w-3xl font-medium" style={{ fontSize: "clamp(32px, 4.5vw, 48px)", lineHeight: 1.08 }}>
          Most platforms bolt Islamic services onto a generic form.{" "}
          <em className="lp-display font-medium" style={{ color: "var(--lp-emph)" }}>As-Sabiqun is built around the handoff.</em>
        </h2>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed" style={{ color: "var(--lp-text-muted)" }}>
          Amanah and ihsan aren&apos;t taglines here - they&apos;re the reason every order carries a visible record from intention through completion.
        </p>
        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 110} className="lp-panel flex min-h-[340px] flex-col rounded-[1.6rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: "var(--lp-gold-soft)", border: "1px solid var(--lp-border)" }}>{p.icon}</div>
                <div className="flex max-w-[72%] flex-wrap justify-end gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide" style={{ backgroundColor: "var(--lp-gold-soft)", border: "1px solid var(--lp-border)", color: "var(--lp-text-muted)" }}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1" />
              <span className="lp-arabic mb-3 text-[26px] font-medium leading-none" style={{ color: "rgba(var(--lp-gold-rgb),0.55)" }}>{p.arabicTitle}</span>
              <h3 className="lp-display mb-2 text-[22px] font-medium">{p.title}</h3>
              <p className="max-w-[34ch] text-[13.5px] leading-relaxed" style={{ color: "var(--lp-text-muted)" }}>{p.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { n: "١", title: "Choose the service", body: "See the scope first, then share the details needed to arrange Korban or Wakaf." },
    { n: "٢", title: "We coordinate it", body: "Our team reviews the request and manages the handoff to a fulfilment partner." },
    { n: "٣", title: "Keep the record", body: "Your receipt, updates, and available reviewed evidence stay with the order." },
  ];
  return (
    <section id="how" className="relative border-t px-6 py-24 lg:px-10 lg:py-36" style={{ borderColor: "var(--lp-border)", backgroundColor: "var(--lp-bg-band)" }}>
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow arabic="كَيْف" english="How it works" />
        <h2 className="lp-display max-w-3xl font-medium" style={{ fontSize: "clamp(32px, 4.5vw, 48px)", lineHeight: 1.08 }}>
          Three steps.{" "}
          <em className="lp-display font-medium" style={{ color: "var(--lp-emph)" }}>Then it&apos;s underway.</em>
        </h2>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed" style={{ color: "var(--lp-text-muted)" }}>
          The same simple loop carries every service from your first request to a documented completion.
        </p>
        <div className="relative mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120} className="lp-panel-dark relative rounded-3xl p-7">
              <div className="mb-5 flex items-baseline justify-between">
                <span className="lp-arabic text-[64px] font-medium leading-none" style={{ color: "rgba(var(--lp-gold-rgb),0.85)" }}>{s.n}</span>
                {i < steps.length - 1 && <ArrowRight size={18} className="hidden translate-x-[14px] md:block" style={{ color: "rgba(var(--lp-gold-rgb),0.4)" }} />}
              </div>
              <h3 className="lp-display mb-2 text-[22px] font-medium">{s.title}</h3>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--lp-text-muted)" }}>{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhoItsFor() {
  const groups = [
    { ar: "الأفراد", title: "Individuals", body: "Arrange Korban or contribute to a Wakaf project with a guided form and a clear service record." },
    { ar: "المؤسسات", title: "Organisations", body: "A practical partner for associations and community programmes that need visible fulfilment, not just a payment link." },
    { ar: "الشركاء", title: "Fulfilment partners", body: "Focused assignments, participant details, and structured proof requirements in one workspace." },
  ];
  return (
    <section className="relative overflow-hidden px-6 py-24 lg:px-10 lg:py-36" style={{ backgroundColor: "var(--lp-bg-deep)" }}>
      <KhatimTexture color="var(--lp-gold)" opacity={0.05} />
      <div className="relative mx-auto max-w-5xl">
        <SectionEyebrow arabic="لِمَنْ" english="Who it's for" />
        <h2 className="lp-display max-w-3xl font-medium" style={{ fontSize: "clamp(32px, 4.5vw, 48px)", lineHeight: 1.08 }}>
          Built for anyone who wants Islamic services{" "}
          <em className="lp-display font-medium" style={{ color: "var(--lp-emph)" }}>handled with amanah.</em>
        </h2>
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {groups.map((c, i) => (
            <Reveal key={c.title} delay={i * 110} className="lp-panel flex min-h-[230px] flex-col rounded-[1.6rem] p-6">
              <span className="lp-arabic mb-4 text-[30px] font-medium leading-none" style={{ color: "rgba(var(--lp-gold-rgb),0.6)" }} lang="ar" dir="rtl">{c.ar}</span>
              <div className="flex-1" />
              <h3 className="lp-display mb-2 text-[20px] font-medium">{c.title}</h3>
              <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--lp-text-muted)" }}>{c.body}</p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120} className="lp-panel-dark mt-5 flex flex-col items-start gap-6 rounded-[1.6rem] p-7 lg:flex-row lg:items-center lg:p-9">
          <span className="lp-display flex-shrink-0 text-[56px] leading-none" style={{ color: "rgba(var(--lp-gold-rgb),0.5)" }}>&ldquo;</span>
          <div>
            <p className="lp-display text-[18px] leading-snug lg:text-[20px]">
              An Islamic service platform that treats every handoff as something you can{" "}
              <em style={{ color: "var(--lp-emph)" }}>see</em> - clear scope, human coordination, documented proof.
            </p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: "rgba(var(--lp-gold-rgb),0.7)" }}>Korban and Wakaf · preview website</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function ServicesOutline() {
  return (
    <section id="services" className="relative border-t px-6 py-24 lg:px-10 lg:py-36" style={{ borderColor: "var(--lp-border)" }}>
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow arabic="خِدْمَاتُنَا" english="Our services" />
        <h2 className="lp-display max-w-3xl font-medium" style={{ fontSize: "clamp(32px, 4.5vw, 48px)", lineHeight: 1.08 }}>
          Four focused ways{" "}
          <em className="lp-display font-medium" style={{ color: "var(--lp-emph)" }}>to arrange something good.</em>
        </h2>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed" style={{ color: "var(--lp-text-muted)" }}>
          These are the first services in the As-Sabiqun platform. More will follow as their fulfilment journeys are ready.
        </p>
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2">
          {services.map((service, i) => (
            <Reveal key={service.slug} delay={i * 80}>
              <Link href={service.href} className="lp-panel group flex items-center gap-5 rounded-3xl p-6 transition-transform hover:scale-[1.01] active:scale-[0.99]">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: "var(--lp-gold-soft)", border: "1px solid var(--lp-border)" }}>
                  <span className="lp-arabic text-[22px] font-medium leading-none" style={{ color: "var(--lp-gold)" }} lang="ar" dir="rtl">{service.arabic}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="lp-display text-[18px] font-medium leading-snug">{service.title}</h3>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: "var(--lp-text-muted)" }}>{service.description}</p>
                </div>
                <ArrowUpRight size={18} className="flex-shrink-0 opacity-50 transition-opacity group-hover:opacity-100" style={{ color: "var(--lp-gold)" }} />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  const faqs = [
    { q: "Is this a live website I can pay through?", a: "Not yet - this is a preview of the As-Sabiqun platform. Offerings, prices, orders, and payment states you see here are demonstration data, not real transactions." },
    { q: "What happens after I submit a request?", a: "The order appears in our operations workspace, a team member reviews it, and it's assigned to a fulfilment partner. You can follow the whole trail in your amanah record." },
    { q: "How does the completion proof work?", a: "Once a service is fulfilled, the assigned partner uploads photos or short video. Our team reviews the evidence before it's returned to your order record." },
    { q: "Can organisations use As-Sabiqun, not just individuals?", a: "Yes - associations and community programmes can arrange services the same way, with the same visible scope and documented fulfilment." },
    { q: "What other services are planned?", a: "AI consultancy and business consultancy are on the roadmap alongside Korban and Wakaf, once their service models are ready for a proper journey." },
  ];
  return (
    <section id="faq" className="relative border-t px-6 py-24 lg:px-10 lg:py-36" style={{ borderColor: "var(--lp-border)", backgroundColor: "var(--lp-bg-band)" }}>
      <div className="mx-auto max-w-3xl">
        <SectionEyebrow arabic="أَسْئِلَة" english="Common questions" />
        <h2 className="lp-display mb-12 font-medium" style={{ fontSize: "clamp(32px, 4.5vw, 48px)", lineHeight: 1.08 }}>
          Things people <em className="lp-display font-medium" style={{ color: "var(--lp-emph)" }}>actually</em> ask.
        </h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 70} as="details" className="lp-panel group cursor-pointer rounded-2xl p-5">
              <summary className="flex list-none items-center justify-between gap-4">
                <h3 className="lp-display text-[16px] font-medium leading-snug lg:text-[17px]">{f.q}</h3>
                <ChevronDown size={18} className="flex-shrink-0 transition-transform group-open:rotate-180" style={{ color: "var(--lp-gold)" }} />
              </summary>
              <p className="mt-4 text-[14px] leading-relaxed" style={{ color: "var(--lp-text-muted)" }}>{f.a}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t px-6 py-28 lg:px-10 lg:py-40" style={{ borderColor: "var(--lp-border)" }}>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(var(--lp-gold-rgb),0.15) 0%, transparent 70%)" }} />
      <div className="relative mx-auto max-w-3xl text-center">
        <span className="lp-arabic mb-6 block font-medium leading-none" style={{ fontSize: "clamp(60px, 9vw, 120px)", color: "var(--lp-emph)", textShadow: "0 4px 30px rgba(0,0,0,0.3)" }} lang="ar" dir="rtl">اِبْدَأ</span>
        <p className="mb-8 text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: "rgba(var(--lp-gold-rgb),0.7)" }}>ibda&apos; · begin</p>
        <h2 className="lp-display font-medium" style={{ fontSize: "clamp(34px, 5vw, 52px)", lineHeight: 1.05 }}>
          Your service, clearly delivered.{" "}
          <em className="lp-display font-medium" style={{ color: "var(--lp-emph)" }}>What are you arranging today?</em>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed" style={{ color: "var(--lp-text-muted)" }}>
          Choose Korban or a Wakaf project - review the scope, submit your details, and keep the record with you from request to completion.
        </p>
        <div className="mt-10">
          <Link href="/services" className="lp-pill inline-flex items-center gap-4 rounded-full py-2 pl-7 pr-2 transition-transform hover:scale-105 active:scale-95">
            <span className="text-[16px] font-semibold">Choose a service</span>
            <span className="grid h-10 w-10 place-items-center rounded-full" style={{ backgroundColor: "rgba(var(--lp-gold-rgb),0.3)" }}>
              <ArrowUpRight size={18} strokeWidth={2.5} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="relative border-t px-6 py-14 lg:px-10" style={{ borderColor: "var(--lp-border)" }}>
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="h-9 w-9 shrink-0" />
          <div className="flex flex-col leading-none">
            <span className="lp-display text-[18px] font-semibold tracking-tight" style={{ color: "var(--lp-gold)" }}>As-Sabiqun</span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--lp-text-muted)" }}>Association Consultancy</span>
          </div>
        </Link>
        <div className="flex flex-wrap items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="text-[12px] font-semibold" style={{ color: "var(--lp-text-muted)" }}>{l.label}</Link>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col items-start justify-between gap-2 border-t pt-6 text-[11px] sm:flex-row sm:items-center" style={{ borderColor: "var(--lp-border)", color: "var(--lp-text-muted)" }}>
        <span>© 2026 As-Sabiqun Association Consultancy · Preview website</span>
        <span className="lp-arabic" style={{ color: "rgba(var(--lp-gold-rgb),0.6)" }} lang="ar" dir="rtl">الأَمَانَة وَالإِحْسَان</span>
      </div>
    </footer>
  );
}
