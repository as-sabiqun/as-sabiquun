import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { ServiceCard, services } from "@/components/service-card";

const steps = [
  ["01", "Choose with clarity", "Select a service and review what is included before sharing your details."],
  ["02", "We coordinate", "Our team reviews the request and connects it with the right fulfilment partner."],
  ["03", "Receive the record", "After review, your receipt and available completion evidence are kept together."],
] as const;

const deliverables = [
  ["Receipt", "A clear record of the service, amount, and reference number."],
  ["Nameplate or certificate", "A personalised document or nameplate where the service supports it."],
  ["Verified media", "Available photos or short videos reviewed before they are shared with you."],
] as const;

export default function Home() {
  return (
    <>
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <p className="eyebrow">Islamic services · Singapore</p>
            <h1 className="display mt-6 max-w-3xl text-[clamp(3.15rem,7vw,6.6rem)] leading-[.88]">
              Good deeds,<br /><span className="text-[var(--teal)]">carried with amanah.</span>
            </h1>
            <p className="lead mt-8 max-w-xl">
              A calm, trusted place to arrange Korban, Wakaf, and community giving—with human coordination and a clear record of fulfilment.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link className="btn" href="/services">Explore services <span aria-hidden="true">→</span></Link>
              <Link className="btn btn-secondary" href="/#how-it-works">How it works</Link>
            </div>
          </div>

          <div className="hero-brand-panel" aria-label="As-Sābiqūn Islamic services">
            <span className="hero-panel-kicker">السَّابِقُون</span>
            <BrandMark className="hero-seal" priority />
            <div className="hero-panel-caption">
              <span>Intention</span><i aria-hidden="true"></i><span>Service</span><i aria-hidden="true"></i><span>Proof</span>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Service commitments">
        <div className="container trust-strip-grid">
          <p><span>01</span><strong>Clear choices</strong><small>Know what you are arranging</small></p>
          <p><span>02</span><strong>Human coordination</strong><small>A team oversees each handoff</small></p>
          <p><span>03</span><strong>Proof after fulfilment</strong><small>Records stay with your order</small></p>
        </div>
      </section>

      <section className="section" id="services">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Ways to give</p>
              <h2 className="section-title mt-4 max-w-3xl">Begin with the service that matters to you.</h2>
            </div>
            <div>
              <p className="lead max-w-md">Each journey is designed to make the next step obvious, while keeping responsible people involved throughout.</p>
              <Link className="text-link mt-5" href="/services">View all services <span aria-hidden="true">→</span></Link>
            </div>
          </div>
          <div className="service-grid mt-14">
            {services.map((service) => <ServiceCard key={service.slug} service={service} />)}
          </div>
        </div>
      </section>

      <section className="amanah-section" id="how-it-works">
        <div className="container">
          <div className="amanah-heading">
            <div>
              <p className="eyebrow eyebrow-light">The Amanah trail</p>
              <h2 className="section-title mt-4 max-w-3xl text-white">From sincere intention to a documented act.</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-white/90">One visible journey helps the customer, our team, and the fulfilment partner understand what comes next.</p>
          </div>
          <div className="amanah-steps">
            {steps.map(([number, title, description]) => (
              <article key={number}>
                <span className="amanah-number">{number}</span>
                <h3 className="display mt-10 text-[1.75rem] text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/90">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section receive-section">
        <div className="container grid items-center gap-14 lg:grid-cols-[.9fr_1.1fr]">
          <div className="receive-visual">
            <div className="proof-sheet proof-sheet-back" aria-hidden="true"></div>
            <div className="proof-sheet">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-5">
                <BrandMark className="h-14 w-14" />
                <span className="status">Reviewed</span>
              </div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[.14em] text-[var(--muted)]">Service record</p>
              <strong className="display mt-3 block text-3xl">ASB–SERVICE–001</strong>
              <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
                <span><small>Service</small><b>Wakaf project</b></span>
                <span><small>Status</small><b>Completed</b></span>
              </div>
              <div className="mt-10 h-2 w-full rounded-full bg-[var(--teal-soft)]"><div className="h-full w-full rounded-full bg-[var(--teal)]"></div></div>
            </div>
          </div>
          <div>
            <p className="eyebrow">What you receive</p>
            <h2 className="section-title mt-4">A record that closes the loop.</h2>
            <p className="lead mt-6 max-w-xl">The exact documents depend on the service, but the goal stays the same: keep the important details together and make completion visible.</p>
            <div className="deliverables mt-10">
              {deliverables.map(([title, description], index) => (
                <div key={title}>
                  <span className="numeral">0{index + 1}</span>
                  <div><h3>{title}</h3><p>{description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="accountability-band">
        <div className="container grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="eyebrow eyebrow-light">Built around accountability</p>
            <h2 className="display mt-5 max-w-3xl text-[clamp(2.5rem,5vw,4.8rem)] leading-[.94] text-white">
              Trust is not a badge.<br />It is a process you can see.
            </h2>
          </div>
          <div className="accountability-note">
            <span className="arabic" lang="ar" dir="rtl">الأمانة</span>
            <p>Orders, assignments, updates, and evidence are designed to move through one connected operational record.</p>
            <Link href="/about">Why we are building this <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="closing-cta">
        <div className="container text-center">
          <BrandMark className="mx-auto h-24 w-24" />
          <p className="eyebrow mt-8">Begin with intention</p>
          <h2 className="section-title mx-auto mt-5 max-w-4xl">A clearer way to arrange meaningful service.</h2>
          <p className="lead mx-auto mt-6 max-w-xl">Explore the first four services being prepared by As-Sābiqūn.</p>
          <Link className="btn mt-9" href="/services">Choose a service <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </>
  );
}
