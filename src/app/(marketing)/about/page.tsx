import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn why As-Sābiqūn is building a clearer way to coordinate Islamic services.",
};

const principles = [
  ["Clarity", "Say what happens, who is responsible, and what comes next."],
  ["Amanah", "Treat every person, contribution, and service record with care."],
  ["Human judgment", "Use technology to support responsible people—not replace them."],
  ["Useful progress", "Begin focused, learn from real service, and improve deliberately."],
] as const;

const teamAreas = [
  ["Founder & strategy", "Purpose, partnerships, and the direction of the platform."],
  ["Service operations", "Orders, fulfilment partners, review, and customer updates."],
  ["Technology & experience", "The systems that keep every handoff clear and connected."],
] as const;

export default function AboutPage() {
  return (
    <>
      <section className="page-hero about-hero">
        <div className="container grid items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="eyebrow">About As-Sābiqūn · مَنْ نَحْنُ</p>
            <h1 className="display mt-6 max-w-4xl text-[clamp(3.2rem,7vw,6rem)] leading-[.9]">Purpose before platform.</h1>
            <p className="lead mt-8 max-w-xl">We are building one thoughtful home for Islamic services—making each journey easier to understand, coordinate, and remember.</p>
          </div>
          <div className="about-seal-panel">
            <span className="arabic" lang="ar" dir="rtl">السَّابِقُون</span>
            <BrandMark className="h-64 w-64 sm:h-80 sm:w-80" priority />
            <small>Those who go before in good</small>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid gap-5 lg:grid-cols-2">
          <article className="statement-card statement-card-teal">
            <span>Our mission</span>
            <h2>Make meaningful Islamic services easier to access and easier to trust.</h2>
            <p>We bring customer requests, team coordination, partner fulfilment, and available evidence into one understandable journey.</p>
          </article>
          <article className="statement-card statement-card-gold">
            <span>Our vision</span>
            <h2>A trusted platform that helps good intentions become well-carried action.</h2>
            <p>We hope to grow from Islamic services into responsible AI and business consultancy when each area is ready to serve people well.</p>
          </article>
        </div>
      </section>

      <section className="section bg-[var(--teal-soft)]">
        <div className="container grid gap-14 lg:grid-cols-[.78fr_1.22fr]">
          <div><p className="eyebrow">How we work</p><h2 className="section-title mt-4">Principles before features.</h2><p className="lead mt-6 max-w-md">The website should express the same care expected from the service itself.</p></div>
          <div className="principle-grid">
            {principles.map(([title, description], index) => (
              <article key={title}><span className="numeral">0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow">The team</p><h2 className="section-title mt-4">People behind the service.</h2></div>
            <p className="lead max-w-md">Names and portraits will be added once the founding team is ready to introduce itself publicly.</p>
          </div>
          <div className="team-grid mt-14">
            {teamAreas.map(([title, description], index) => (
              <article key={title}>
                <div className="team-placeholder"><span>AS</span><small>Profile coming soon</small></div>
                <span className="numeral mt-6 block text-sm text-[var(--teal)]">0{index + 1}</span>
                <h3 className="display mt-2 text-2xl">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="accountability-band compact-band">
        <div className="container flex flex-col items-start justify-between gap-9 md:flex-row md:items-end">
          <div><p className="eyebrow eyebrow-light">The first chapter</p><h2 className="section-title mt-4 max-w-3xl text-white">Islamic services, coordinated with care.</h2></div>
          <Link href="/services" className="btn btn-light">Explore services <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </>
  );
}
