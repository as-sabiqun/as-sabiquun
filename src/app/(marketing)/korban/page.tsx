import type { Metadata } from "next";
import { KorbanForm } from "@/components/forms";

export const metadata: Metadata = {
  title: "Korban Service",
  description: "Arrange Korban through a clear, coordinated service journey with As-Sābiqūn.",
};

const included = [
  ["Order receipt", "Your service selection, participant details, and reference in one record."],
  ["Participant record", "Names remain connected to the correct order throughout fulfilment."],
  ["Completion evidence", "Available photos or video are reviewed before being returned to you."],
] as const;

export default function KorbanPage() {
  return (
    <>
      <section className="service-detail-hero">
        <div className="container grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="eyebrow">Korban · الأُضْحِيَّة</p>
            <h1 className="display mt-6 text-[clamp(3.3rem,7vw,6.3rem)] leading-[.88]">Korban,<br /><span className="text-[var(--teal)]">coordinated with care.</span></h1>
            <p className="lead mt-8 max-w-xl">Choose the number of shares, provide participant names, and keep the service journey connected from request to completion.</p>
          </div>
          <div className="service-detail-art korban-detail-art">
            <span className="numeral">01</span>
            <div className="detail-arch"><b className="arabic" lang="ar" dir="rtl">الأضحية</b><small>Service with intention</small></div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Korban service features">
        <div className="container trust-strip-grid">
          <p><span>01</span><strong>Up to 7 shares</strong><small>Participant details stay together</small></p>
          <p><span>02</span><strong>Managed handoff</strong><small>Assigned through the operations team</small></p>
          <p><span>03</span><strong>Documented completion</strong><small>Evidence is reviewed before sharing</small></p>
        </div>
      </section>

      <section className="section" id="order">
        <div className="container grid items-start gap-14 lg:grid-cols-[.72fr_1.28fr]">
          <div className="service-intro lg:sticky lg:top-28">
            <p className="eyebrow">How this preview works</p>
            <h2 className="section-title mt-4">One clear package. One connected record.</h2>
            <p className="lead mt-6">This preview demonstrates the intended customer journey using a placeholder overseas cow-share package.</p>
            <ol className="service-checklist mt-9">
              <li><span>1</span>Select the number of shares</li>
              <li><span>2</span>Add each participant name</li>
              <li><span>3</span>Review the simulated order</li>
            </ol>
            <div className="preview-note mt-9"><strong>Preview content</strong><p>Package, price, location, and religious wording will be confirmed before launch. No payment or Korban is carried out here.</p></div>
          </div>
          <KorbanForm />
        </div>
      </section>

      <section className="section bg-[var(--teal-soft)]">
        <div className="container grid gap-14 lg:grid-cols-[.75fr_1.25fr]">
          <div><p className="eyebrow">What you receive</p><h2 className="section-title mt-4">The important details, kept together.</h2></div>
          <div className="included-grid">
            {included.map(([title, description], index) => <article key={title}><span className="numeral">0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}
          </div>
        </div>
      </section>
    </>
  );
}
