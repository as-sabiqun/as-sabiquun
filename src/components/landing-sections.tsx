import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown, HandHeart, ShieldCheck, Sparkles } from "lucide-react";
import { services } from "@/components/service-card";
import { Reveal } from "@/components/landing-reveal";

export function SectionEyebrow({ label }: { label: string }) {
  return (
    <div className="mb-6 inline-flex items-center gap-3">
      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: "var(--gold)" }} />
      <span className="text-[10px] font-bold uppercase tracking-[0.32em]" style={{ color: "var(--gold)" }}>{label}</span>
    </div>
  );
}

export function Hero() {
  return (
    <section className="lp-hero-canvas relative flex min-h-[calc(100vh-88px)] flex-col overflow-hidden">
      <div className="lp-hero-glow pointer-events-none absolute inset-0 z-[2]" aria-hidden="true" />
      <div className="lp-grain pointer-events-none absolute inset-0 z-[3]" aria-hidden="true" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.26em]" style={{ color: "var(--gold)" }}>Islamic services - Singapore</p>
        <h1 className="display max-w-2xl" style={{ fontSize: "clamp(42px, 6.8vw, 80px)", lineHeight: .98, color: "var(--teal-dark)" }}>
          Islamic services,<br />clearly carried through.
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-[16px] font-medium leading-relaxed lg:text-[17px]" style={{ color: "var(--ink)" }}>
          Choose a service, review its scope, and follow every handoff from your request to the completion record.
        </p>
        <div className="mt-8 flex items-center justify-center">
          <Link href="/services" className="btn">
            Choose a service
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>Website preview - no live payments are being accepted</p>
      </div>

      <a href="#record" className="relative z-10 mx-auto mb-7 flex flex-col items-center" aria-label="Scroll down">
        <ChevronDown size={20} className="animate-bounce" style={{ color: "var(--gold)" }} />
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
    <section id="record" className="relative overflow-hidden px-6 py-24 lg:px-10 lg:py-32" style={{ backgroundColor: "var(--white)" }}>
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <SectionEyebrow label="See a live record" />
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.5vw, 50px)", lineHeight: 1.06 }}>
            You don&apos;t just place an order.{" "}
            <span style={{ color: "var(--gold)" }}>You follow it.</span>
          </h2>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed" style={{ color: "var(--muted)" }}>
            Every service becomes an amanah record - reference, status, and completion evidence kept together from the moment you submit a request to the day it&apos;s fulfilled.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {["Ordered", "Reviewed", "Assigned", "Documented"].map((s, i) => (
              <span key={s} className="chip" style={{ backgroundColor: "rgba(162,124,71,0.1)", color: "var(--gold)" }}>
                <span className="opacity-60">{i + 1}</span> {s}
              </span>
            ))}
          </div>
          <div className="mt-9">
            <Link href="/korban" className="btn">
              See how it works
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Reveal>
        <Reveal delay={120} className="card card-dark p-6 md:p-7">
          <div className="flex items-center justify-between border-b pb-5" style={{ borderColor: "rgba(255,253,250,.14)" }}>
            <div>
              <p className="text-[.68rem] font-black uppercase tracking-[.16em]" style={{ color: "var(--muted)" }}>Example amanah record</p>
              <h3 className="display mt-1 text-xl">Wakaf Quran</h3>
            </div>
            <span className="rounded-full px-3 py-2 text-[.65rem] font-black" style={{ backgroundColor: "rgba(162,124,71,0.22)", color: "var(--gold)" }}>In fulfilment</span>
          </div>
          <ol className="mt-5 space-y-1">
            {recordSteps.map((step) => (
              <li key={step.label} className="grid grid-cols-[26px_1fr_auto] items-center gap-3 rounded-xl px-2 py-2.5" style={step.state === "current" ? { backgroundColor: "rgba(255,253,250,.06)" } : undefined}>
                <span
                  className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-black"
                  style={
                    step.state === "complete"
                      ? { backgroundColor: "var(--gold)", color: "var(--teal-dark)" }
                      : step.state === "current"
                        ? { border: "1px solid var(--gold)", color: "var(--gold)" }
                        : { border: "1px solid rgba(255,253,250,.2)", color: "rgba(255,253,250,.4)" }
                  }
                >
                  {step.state === "complete" ? "✓" : ""}
                </span>
                <span className="text-sm font-semibold">{step.label}</span>
                <span className="text-[.68rem] font-bold" style={{ color: "var(--muted)" }}>
                  {step.state === "complete" ? "Done" : step.state === "current" ? "Current" : "Next"}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs leading-6" style={{ color: "var(--muted)" }}>Illustrative record - no live order has been created.</p>
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
    <section className="relative border-y px-6 py-10 lg:px-10 lg:py-14" style={{ borderColor: "var(--line)", backgroundColor: "var(--cream-dark)" }}>
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-10">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 90} className="text-center lg:text-left">
            <div className="numeral mb-2 text-[44px] leading-none lg:text-[56px]" style={{ color: "var(--gold)" }}>{s.num}</div>
            <div className="display text-[14px] leading-snug" style={{ color: "var(--ink)" }}>{s.label}</div>
            <div className="mt-1 text-[11px]" style={{ color: "var(--muted)" }}>{s.sub}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function WhyDifferent() {
  const pillars = [
    { title: "Clear scope, first", body: "See the service, the demonstration price, and what's included before you share a single detail. No surprises between request and receipt.", icon: <Sparkles size={22} style={{ color: "var(--gold)" }} />, tags: ["Scope upfront", "No hidden steps"] },
    { title: "Human coordination", body: "A team reviews every request and manages the handoff to a fulfilment partner - your order is never just a queue position.", icon: <HandHeart size={22} style={{ color: "var(--gold)" }} />, tags: ["Reviewed by people", "Assigned, not automated"] },
    { title: "Documented proof", body: "Available photos or video are reviewed before they're returned to you, so completion means something you can actually see.", icon: <ShieldCheck size={22} style={{ color: "var(--gold)" }} />, tags: ["Reviewed evidence", "Kept with your order"] },
  ];
  return (
    <section id="why" className="relative px-6 py-24 lg:px-10 lg:py-36">
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow label="Why As-Sabiqun" />
        <h2 className="display max-w-3xl" style={{ fontSize: "clamp(32px, 4.5vw, 48px)", lineHeight: 1.08 }}>
          Most platforms bolt Islamic services onto a generic form.{" "}
          <span style={{ color: "var(--gold)" }}>As-Sabiqun is built around the handoff.</span>
        </h2>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Amanah and ihsan aren&apos;t taglines here - they&apos;re the reason every order carries a visible record from intention through completion.
        </p>
        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 110} className="card flex min-h-[300px] flex-col p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: "rgba(162,124,71,0.1)", border: "1px solid var(--line)" }}>{p.icon}</div>
                <div className="flex max-w-[72%] flex-wrap justify-end gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="chip" style={{ backgroundColor: "rgba(162,124,71,0.1)", color: "var(--muted)" }}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1" />
              <h3 className="display mb-2 text-[22px]">{p.title}</h3>
              <p className="max-w-[34ch] text-[13.5px] leading-relaxed" style={{ color: "var(--muted)" }}>{p.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { n: "01", title: "Choose the service", body: "See the scope first, then share the details needed to arrange Korban or Wakaf." },
    { n: "02", title: "We coordinate it", body: "Our team reviews the request and manages the handoff to a fulfilment partner." },
    { n: "03", title: "Keep the record", body: "Your receipt, updates, and available reviewed evidence stay with the order." },
  ];
  return (
    <section id="how" className="relative border-t px-6 py-24 lg:px-10 lg:py-36" style={{ borderColor: "var(--line)", backgroundColor: "var(--cream)" }}>
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow label="How it works" />
        <h2 className="display max-w-3xl" style={{ fontSize: "clamp(32px, 4.5vw, 48px)", lineHeight: 1.08 }}>
          Three steps.{" "}
          <span style={{ color: "var(--gold)" }}>Then it&apos;s underway.</span>
        </h2>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed" style={{ color: "var(--muted)" }}>
          The same simple loop carries every service from your first request to a documented completion.
        </p>
        <div className="relative mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120} className="card card-dark relative p-7">
              <div className="mb-5 flex items-baseline justify-between">
                <span className="numeral text-[48px] leading-none" style={{ color: "rgba(162,124,71,0.85)" }}>{s.n}</span>
                {i < steps.length - 1 && <ArrowRight size={18} className="hidden translate-x-[14px] md:block" style={{ color: "rgba(162,124,71,0.4)" }} />}
              </div>
              <h3 className="display mb-2 text-[22px]">{s.title}</h3>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhoItsFor() {
  const groups = [
    { title: "Individuals", body: "Arrange Korban or contribute to a Wakaf project with a guided form and a clear service record." },
    { title: "Organisations", body: "A practical partner for associations and community programmes that need visible fulfilment, not just a payment link." },
    { title: "Fulfilment partners", body: "Focused assignments, participant details, and structured proof requirements in one workspace." },
  ];
  return (
    <section className="relative overflow-hidden px-6 py-24 lg:px-10 lg:py-36" style={{ backgroundColor: "var(--cream-dark)" }}>
      <div className="relative mx-auto max-w-5xl">
        <SectionEyebrow label="Who it's for" />
        <h2 className="display max-w-3xl" style={{ fontSize: "clamp(32px, 4.5vw, 48px)", lineHeight: 1.08 }}>
          Built for anyone who wants Islamic services{" "}
          <span style={{ color: "var(--gold)" }}>handled with amanah.</span>
        </h2>
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {groups.map((c, i) => (
            <Reveal key={c.title} delay={i * 110} className="card flex min-h-[200px] flex-col p-6">
              <h3 className="display mb-2 text-[20px]">{c.title}</h3>
              <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--muted)" }}>{c.body}</p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120} className="card card-dark mt-5 flex flex-col items-start gap-6 p-7 lg:flex-row lg:items-center lg:p-9">
          <span className="display flex-shrink-0 text-[56px] leading-none" style={{ color: "rgba(162,124,71,0.5)" }}>&ldquo;</span>
          <div>
            <p className="display text-[18px] leading-snug lg:text-[20px]">
              An Islamic service platform that treats every handoff as something you can{" "}
              <span style={{ color: "var(--gold)" }}>see</span> - clear scope, human coordination, documented proof.
            </p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: "rgba(162,124,71,0.85)" }}>Korban and Wakaf · preview website</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function ServicesOutline() {
  return (
    <section id="services" className="relative border-t px-6 py-24 lg:px-10 lg:py-36" style={{ borderColor: "var(--line)" }}>
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow label="Our services" />
        <h2 className="display max-w-3xl" style={{ fontSize: "clamp(32px, 4.5vw, 48px)", lineHeight: 1.08 }}>
          Four focused ways{" "}
          <span style={{ color: "var(--gold)" }}>to arrange something good.</span>
        </h2>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed" style={{ color: "var(--muted)" }}>
          These are the first services in the As-Sabiqun platform. More will follow as their fulfilment journeys are ready.
        </p>
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2">
          {services.map((service, i) => (
            <Reveal key={service.slug} delay={i * 80}>
              <Link href={service.href} className="card group flex items-center gap-5 p-6 transition-transform hover:scale-[1.01] active:scale-[0.99]">
                <span className="numeral grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[18px]" style={{ backgroundColor: "rgba(162,124,71,0.1)", border: "1px solid var(--line)", color: "var(--gold)" }}>{service.number}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="display text-[18px] leading-snug">{service.title}</h3>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: "var(--muted)" }}>{service.description}</p>
                </div>
                <ArrowUpRight size={18} className="flex-shrink-0 opacity-50 transition-opacity group-hover:opacity-100" style={{ color: "var(--gold)" }} />
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
    <section id="faq" className="relative border-t px-6 py-24 lg:px-10 lg:py-36" style={{ borderColor: "var(--line)", backgroundColor: "var(--cream)" }}>
      <div className="mx-auto max-w-3xl">
        <SectionEyebrow label="Common questions" />
        <h2 className="display mb-12" style={{ fontSize: "clamp(32px, 4.5vw, 48px)", lineHeight: 1.08 }}>
          Things people <span style={{ color: "var(--gold)" }}>actually</span> ask.
        </h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 70} as="details" className="card group cursor-pointer p-5">
              <summary className="flex list-none items-center justify-between gap-4">
                <h3 className="display text-[16px] leading-snug lg:text-[17px]">{f.q}</h3>
                <ChevronDown size={18} className="flex-shrink-0 transition-transform group-open:rotate-180" style={{ color: "var(--gold)" }} />
              </summary>
              <p className="mt-4 text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>{f.a}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t px-6 py-28 lg:px-10 lg:py-40" style={{ borderColor: "var(--line)" }}>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(162,124,71,0.15) 0%, transparent 70%)" }} />
      <div className="relative mx-auto max-w-3xl text-center">
        <SectionEyebrow label="Begin with clarity" />
        <h2 className="display" style={{ fontSize: "clamp(34px, 5.5vw, 58px)", lineHeight: 1.02 }}>
          Your service, clearly delivered.{" "}
          <span style={{ color: "var(--gold)" }}>What are you arranging today?</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Choose Korban or a Wakaf project - review the scope, submit your details, and keep the record with you from request to completion.
        </p>
        <div className="mt-10">
          <Link href="/services" className="btn">
            Choose a service
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
