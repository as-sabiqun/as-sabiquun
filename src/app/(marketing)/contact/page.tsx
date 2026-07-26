import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the As-Sabiqun team about Islamic services or get support for an existing project.",
};

export default function ContactPage() {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <p className="eyebrow-label">Contact</p>
          <h1 className="display max-w-4xl">Tell us what you are trying to arrange.</h1>
          <p className="lede">Ask about a service before you begin, or sign in to raise a concern about an existing project.</p>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="container grid gap-6 lg:grid-cols-2">
          <article className="card flex min-h-[340px] flex-col p-7 lg:p-10">
            <span className="numeral text-xs text-[var(--gold)]">01</span>
            <h2 className="display mt-6 text-3xl">Starting a new service</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[var(--muted)]">Message the team with the service you are considering, the country if relevant, and anything you need clarified before ordering.</p>
            <div className="mt-auto flex flex-wrap gap-3 pt-10">
              <a className="btn" href="https://wa.me/6589933786" target="_blank" rel="noreferrer">Message on WhatsApp <span aria-hidden="true">↗</span></a>
              <a className="btn btn-secondary" href="tel:+6589933786">Call +65 8993 3786</a>
            </div>
          </article>

          <article className="card flex min-h-[340px] flex-col p-7 lg:p-10">
            <span className="numeral text-xs text-[var(--gold)]">02</span>
            <h2 className="display mt-6 text-3xl">Help with an existing project</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[var(--muted)]">Open support from your customer portal so the concern stays connected to the right project and order reference.</p>
            <div className="mt-auto flex flex-wrap gap-3 pt-10">
              <Link className="btn" href="/dashboard/report">Report a concern <span aria-hidden="true">→</span></Link>
              <Link className="btn btn-secondary" href="/login">Customer login</Link>
            </div>
          </article>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--teal)] py-16 text-white lg:py-20">
        <div className="container grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
          <h2 className="display text-3xl leading-tight lg:text-5xl">A useful message gets you a useful answer.</h2>
          <div>
            <p className="text-sm leading-7 text-white/75">Include the service name and your question. For an existing project, also include the order reference—but do not send card details, passwords, or identity documents through WhatsApp.</p>
          </div>
        </div>
      </section>
    </>
  );
}
