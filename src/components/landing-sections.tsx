import Link from "next/link";
import { services } from "@/components/service-card";

function AmanahStar({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <polygon points="24,2 27.8,14.8 39.6,8.4 33.2,20.2 46,24 33.2,27.8 39.6,39.6 27.8,33.2 24,46 20.2,33.2 8.4,39.6 14.8,27.8 2,24 14.8,20.2 8.4,8.4 20.2,14.8" />
    </svg>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  copy,
}: {
  id: string;
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="lp-section-heading">
      <p className="lp-eyebrow"><span aria-hidden="true" />{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}

export function Hero() {
  return (
    <section className="lp-hero" aria-labelledby="landing-title">
      <div className="lp-hero-mark" aria-hidden="true">
        <AmanahStar />
      </div>
      <div className="lp-hero-inner">
        <p className="lp-arabic" lang="ar" dir="rtl">السَّابِقُونَ إِلَى الْخَيْرِ</p>
        <p className="lp-kicker">Islamic services, thoughtfully coordinated</p>
        <h1 id="landing-title">Good intentions deserve clear follow-through.</h1>
        <p className="lp-hero-copy">
          Arrange Korban and Wakaf through one trusted service. From payment to verified proof,
          every handoff stays visible in your Amanah record.
        </p>
        <div className="lp-actions">
          <Link className="lp-button lp-button-primary" href="/services">
            Choose a service <span aria-hidden="true">→</span>
          </Link>
          <a className="lp-button lp-button-quiet" href="#how">
            See how it works
          </a>
        </div>
      </div>
      <div className="lp-service-ribbon" aria-label="Available services">
        {services.map((service) => <span key={service.slug}>{service.title}</span>)}
      </div>
    </section>
  );
}

export function ServicesOutline() {
  return (
    <section className="lp-section lp-services" id="services" aria-labelledby="services-title">
      <div className="lp-container">
        <SectionHeading
          id="services-title"
          eyebrow="Choose a service"
          title="One careful process, shaped for each act of giving."
          copy="Start with the service you need. You will see the scope, provide the right details, and review everything before payment."
        />
        <div className="lp-service-list">
          {services.map((service) => (
            <Link className="lp-service-row" href={service.href} key={service.slug}>
              <span className="lp-service-number">{service.number}</span>
              <span className="lp-service-name">{service.title}</span>
              <span className="lp-service-copy">{service.description}</span>
              <span className="lp-service-action">View service <span aria-hidden="true">↗</span></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AmanahShowcase() {
  const steps = [
    ["01", "Request received", "Your service, dedication, and payment are recorded together."],
    ["02", "Partner assigned", "An approved partner accepts the work and begins fulfilment."],
    ["03", "Evidence reviewed", "Location and required media are checked by our team."],
    ["04", "Report delivered", "Your completion record is sent by email and Telegram."],
  ];

  return (
    <section className="lp-section lp-amanah" id="how" aria-labelledby="amanah-title">
      <div className="lp-container lp-amanah-layout">
        <div>
          <SectionHeading
            id="amanah-title"
            eyebrow="The Amanah trail"
            title="Every request leaves a record you can follow."
            copy="The same four-stage trail guides every service. It makes the work clear for you, the fulfilment partner, and the team reviewing it."
          />
          <ol className="lp-trail">
            {steps.map(([number, title, copy]) => (
              <li key={number}>
                <span className="lp-trail-marker"><AmanahStar /></span>
                <span className="lp-trail-number">{number}</span>
                <span><strong>{title}</strong><small>{copy}</small></span>
              </li>
            ))}
          </ol>
        </div>

        <article className="lp-record" aria-label="Example project record">
          <header>
            <div>
              <p>Example Amanah record</p>
              <h3>Wakaf Quran</h3>
            </div>
            <span>In review</span>
          </header>
          <div className="lp-record-summary">
            <div><span>Project</span><strong>Quran distribution</strong></div>
            <div><span>Current step</span><strong>Evidence review</strong></div>
          </div>
          <ol className="lp-record-progress">
            <li className="is-done"><span>1</span><strong>Payment confirmed</strong><small>Complete</small></li>
            <li className="is-done"><span>2</span><strong>Partner fulfilment</strong><small>Complete</small></li>
            <li className="is-current"><span>3</span><strong>Admin verification</strong><small>In progress</small></li>
            <li><span>4</span><strong>Customer report</strong><small>Next</small></li>
          </ol>
          <p className="lp-record-note">Illustrative record. Your dashboard reflects the live state of your own project.</p>
        </article>
      </div>
    </section>
  );
}

export function Accountability() {
  const proof = [
    ["Exact location", "Country, locality, address, and coordinates"],
    ["9 photographs", "Before, during, and after the project"],
    ["4 videos", "Before, during, after, and a dua video"],
    ["Admin review", "Evidence approved before your report is sent"],
  ];

  return (
    <section className="lp-proof" aria-labelledby="proof-title">
      <div className="lp-container lp-proof-layout">
        <div>
          <p className="lp-eyebrow lp-eyebrow-light"><span aria-hidden="true" />Accountability by design</p>
          <h2 id="proof-title">Completion means more than changing a status.</h2>
          <p>
            A partner cannot submit a project without its required location and evidence.
            Our team reviews that record before it reaches you.
          </p>
          <Link href="/about" className="lp-text-link">How As-Sabiqun works <span aria-hidden="true">→</span></Link>
        </div>
        <dl className="lp-proof-list">
          {proof.map(([label, copy], index) => (
            <div key={label}>
              <dt><span>{String(index + 1).padStart(2, "0")}</span>{label}</dt>
              <dd>{copy}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function FAQ() {
  const faqs = [
    ["What happens after payment?", "Payment must be confirmed securely before the request is made available to a fulfilment partner. You can then follow the project from your dashboard."],
    ["How will I receive completion proof?", "After admin verification, your completion report is sent by email and Telegram. A secure copy also remains available from your project page."],
    ["Who carries out the project?", "An approved partner accepts the assignment. As-Sabiqun coordinates the handoff, checks the required evidence, and keeps the operational record."],
    ["What if something needs correcting?", "The reviewer returns the submission to the partner with a reason. A corrected submission is reviewed as a new version, so the history remains clear."],
  ];

  return (
    <section className="lp-section lp-faq" aria-labelledby="faq-title">
      <div className="lp-container lp-faq-layout">
        <SectionHeading
          id="faq-title"
          eyebrow="Before you begin"
          title="Questions, answered plainly."
          copy="The service is designed to make each handoff understandable. Here are the details customers ask about most often."
        />
        <div className="lp-faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}<span aria-hidden="true">+</span></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="lp-final" aria-labelledby="final-title">
      <div className="lp-container">
        <AmanahStar className="lp-final-star" />
        <p className="lp-arabic" lang="ar" dir="rtl">بِسْمِ اللَّهِ</p>
        <h2 id="final-title">Begin with clarity.</h2>
        <p>Choose a service, review the details, and keep its Amanah record with you through completion.</p>
        <Link className="lp-button lp-button-primary" href="/services">
          Explore all services <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
