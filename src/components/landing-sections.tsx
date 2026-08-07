import Link from "next/link";
import type { CatalogService } from "@/components/service-card";

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

export function Hero({ services }: { services: CatalogService[] }) {
  return (
    <section className="lp-hero" aria-labelledby="landing-title">
      <div className="lp-hero-mark" aria-hidden="true">
        <AmanahStar />
      </div>
      <div className="lp-hero-inner">
        <p className="lp-arabic" lang="ar" dir="rtl">السَّابِقُونَ إِلَى الْخَيْرِ</p>
        <p className="lp-kicker">Give with confidence</p>
        <h1 id="landing-title">Choose a service. We handle the rest.</h1>
        <p className="lp-hero-copy">
          Pay online. We arrange the work, check the photos and videos,
          and send you a report when it is done.
        </p>
        <div className="lp-actions">
          <a className="lp-button lp-button-primary" href="#services">
            Pick a service <span aria-hidden="true">→</span>
          </a>
          <a className="lp-button lp-button-quiet" href="#how">
            How it works
          </a>
        </div>
      </div>
      <div className="lp-service-ribbon" aria-label="Pick a service">
        {services.map((service) => (
          <Link href={service.href} key={service.slug}>
            {service.title} <span aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ServicesOutline({ services }: { services: CatalogService[] }) {
  return (
    <section className="lp-section lp-services" id="services" aria-labelledby="services-title">
      <div className="lp-container">
        <SectionHeading
          id="services-title"
          eyebrow="Pick one"
          title="What would you like to give?"
          copy="Pick a service. We will show you the price and what happens next."
        />
        <div className="lp-service-list">
          {services.map((service) => (
            <Link className="lp-service-row" href={service.href} key={service.slug}>
              <span className="lp-service-number">{service.number}</span>
              <span className="lp-service-name">{service.title}</span>
              <span className="lp-service-copy">{service.description}</span>
              <span className="lp-service-action">Choose <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AmanahShowcase() {
  const steps = [
    ["01", "We receive your order", "Your payment and details are saved."],
    ["02", "A trusted partner starts", "We send the job to an approved partner."],
    ["03", "We check the work", "We review the location, photos, and videos."],
    ["04", "You get the report", "We send it by email and Telegram."],
  ];

  return (
    <section className="lp-section lp-amanah" id="how" aria-labelledby="amanah-title">
      <div className="lp-container lp-amanah-layout">
        <div>
          <SectionHeading
            id="amanah-title"
            eyebrow="What happens next"
            title="See what happens after you pay."
            copy="You can check your project at every step."
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
            <div><span>Current step</span><strong>Checking the proof</strong></div>
          </div>
          <ol className="lp-record-progress">
            <li className="is-done"><span>1</span><strong>Payment confirmed</strong><small>Complete</small></li>
            <li className="is-done"><span>2</span><strong>Partner completed the work</strong><small>Complete</small></li>
            <li className="is-current"><span>3</span><strong>We check the proof</strong><small>In progress</small></li>
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
    ["Exact location", "See where the project happened"],
    ["9 photos", "Before, during, and after the work"],
    ["4 videos", "Before, during, after, and a dua"],
    ["Checked by our team", "We approve the proof before you receive it"],
  ];

  return (
    <section className="lp-proof" aria-labelledby="proof-title">
      <div className="lp-container lp-proof-layout">
        <div>
          <p className="lp-eyebrow lp-eyebrow-light"><span aria-hidden="true" />Accountability by design</p>
          <h2 id="proof-title">We check the proof before you get it.</h2>
          <p>
            The partner must send the location, photos, and videos.
            Our team checks everything first.
          </p>
          <Link href="/about" className="lp-text-link">Learn about us <span aria-hidden="true">→</span></Link>
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
    ["What happens after I pay?", "We send your order to an approved partner. You can follow the project from your dashboard."],
    ["How do I get the proof?", "We send your report by email and Telegram. You can also download it from your project page."],
    ["Who does the work?", "One of our approved partners carries out the project. Our team checks their work."],
    ["What if something is wrong?", "We ask the partner to fix it and send the proof again."],
  ];

  return (
    <section className="lp-section lp-faq" aria-labelledby="faq-title">
      <div className="lp-container lp-faq-layout">
        <SectionHeading
          id="faq-title"
          eyebrow="Need help?"
          title="Common questions."
          copy="Here are simple answers about your order."
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
        <h2 id="final-title">Ready to begin?</h2>
        <p>Pick a service and fill in the short form.</p>
        <Link className="lp-button lp-button-primary" href="/services">
          Pick a service <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
