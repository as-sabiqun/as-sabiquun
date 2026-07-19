import type { Metadata } from "next";
import Link from "next/link";
import { ServiceCard, services } from "@/components/service-card";

export const metadata: Metadata = {
  title: "Islamic Services",
  description: "Explore Korban, Wakaf Water Pump, Wakaf Quran, and Food for Orphans with As-Sābiqūn.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="page-hero page-hero-teal">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow eyebrow-light">Our services · خِدْمَاتُنَا</p>
            <h1 className="display mt-6 max-w-4xl text-[clamp(3.2rem,7vw,6rem)] leading-[.9] text-white">
              Meaningful service,<br />made easier to begin.
            </h1>
          </div>
          <p className="max-w-md text-base leading-8 text-white/90">
            Choose a service, share the required details, and follow one coordinated path through fulfilment and proof.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow">Available first</p><h2 className="section-title mt-4">Four focused ways to contribute.</h2></div>
            <p className="lead max-w-md">These are the first services in the As-Sābiqūn platform. More options can be introduced once their fulfilment journeys are ready.</p>
          </div>
          <div className="service-grid mt-14">
            {services.map((service) => <ServiceCard key={service.slug} service={service} />)}
          </div>
        </div>
      </section>

      <section className="section bg-[var(--teal-soft)]">
        <div className="container grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div><p className="eyebrow">One operating standard</p><h2 className="section-title mt-4">Different service. Same care.</h2></div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Clear scope", "See what the service includes before you begin."],
              ["Responsible handoff", "A team coordinates the work with the assigned partner."],
              ["Completion record", "Available evidence and documents return to your order."],
            ].map(([title, description], index) => (
              <article className="mini-principle" key={title}>
                <span className="numeral">0{index + 1}</span><h3>{title}</h3><p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="closing-cta compact-cta">
        <div className="container flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div><p className="eyebrow">Need help choosing?</p><h2 className="section-title mt-4 max-w-3xl">Tell us what you hope to arrange.</h2></div>
          <Link className="btn" href="/contact">Contact the team <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </>
  );
}
