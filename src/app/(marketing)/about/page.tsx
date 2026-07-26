import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "Learn how As-Sabiqun coordinates Islamic services with clear records, reviewed evidence, and accountable fulfilment.",
};

const principles = [
  ["Amanah", "We treat each request as a trust: its scope, money, handoffs, and evidence remain connected in one record."],
  ["Clarity", "Customers, partners, and administrators see the information they need without hidden steps or vague statuses."],
  ["Verification", "A project is only marked complete for the customer after its evidence is reviewed and its report is sent."],
] as const;

export default function AboutPage() {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <p className="text-sm text-[var(--teal)]" style={{ fontFamily: "var(--font-arabic)" }} lang="ar" dir="rtl">الأَمَانَةُ وَالإِحْسَانُ</p>
          <p className="eyebrow-label mt-5">About As-Sabiqun</p>
          <h1 className="display max-w-4xl">Good intentions deserve careful follow-through.</h1>
          <p className="lede">We are building one clear place to arrange Islamic services, follow their fulfilment, and keep the completion record.</p>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="container grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
          <div>
            <p className="eyebrow-label">Why we exist</p>
            <h2 className="display mt-4 text-3xl leading-tight lg:text-5xl">A service platform built around responsibility.</h2>
          </div>
          <div className="grid content-start gap-5 text-[var(--muted)]">
            <p className="text-base leading-8">Arranging Korban or Wakaf often involves more than a payment. Someone must confirm the details, coordinate a trusted partner, review the work, and return an honest record to the customer.</p>
            <p className="text-base leading-8">As-Sabiqun brings those handoffs into one journey. The customer follows the project, the partner works from a clear brief, and the reviewing team keeps the operational and financial trail intact.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-white py-20 lg:py-24">
        <div className="container">
          <p className="eyebrow-label">Our operating principles</p>
          <div className="mt-10 grid border-t border-[var(--ink)] md:grid-cols-3">
            {principles.map(([title, copy], index) => (
              <article className="border-b border-[var(--line)] py-8 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0" key={title}>
                <span className="numeral text-xs text-[var(--gold)]">{String(index + 1).padStart(2, "0")}</span>
                <h2 className="display mt-5 text-2xl">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="container grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow-label">Start with the service</p>
            <h2 className="display mt-4 max-w-3xl text-3xl leading-tight lg:text-5xl">See what is available and how each journey works.</h2>
          </div>
          <Link className="btn" href="/services">Explore services <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </>
  );
}
