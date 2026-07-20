import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { services } from "@/components/service-card";

const processSteps = [
  ["01", "Choose the service", "See the scope first, then share the details needed to arrange it."],
  ["02", "We coordinate it", "Our team reviews the request and manages the handoff to a fulfilment partner."],
  ["03", "Keep the record", "Your receipt, updates, and available reviewed evidence stay with the order."],
] as const;

const recordSteps = [
  ["Intention recorded", "Complete"],
  ["Team review", "Complete"],
  ["Partner fulfilment", "In progress"],
  ["Reviewed proof", "Next"],
] as const;

export default function Home() {
  return (
    <div className="wise-home">
      <section className="wise-hero">
        <div className="container wise-hero-grid">
          <div className="wise-hero-copy">
            <p className="wise-eyebrow">Islamic services - Singapore</p>
            <h1>Islamic services, clearly carried through.</h1>
            <p className="wise-hero-lead">
              Choose a service, review its scope, and follow each handoff from your request to the completion record.
            </p>
            <div className="wise-hero-actions">
              <Link className="btn" href="#services">Choose a service <span aria-hidden="true">-&gt;</span></Link>
              <Link className="btn btn-secondary" href="#how-it-works">How it works</Link>
            </div>
            <p className="wise-preview-note">Website preview - No live payments are being accepted.</p>
          </div>

          <aside className="wise-record" aria-labelledby="amanah-record-title">
            <div className="wise-record-header">
              <div>
                <p className="wise-record-kicker">Example Amanah Record</p>
                <h2 id="amanah-record-title">Wakaf Quran</h2>
              </div>
              <span className="wise-record-status">In fulfilment</span>
            </div>

            <dl className="wise-record-facts">
              <div><dt>Reference</dt><dd>ASB-PREVIEW-001</dd></div>
              <div><dt>Last update</dt><dd>Partner confirmed</dd></div>
            </dl>

            <ol className="wise-record-list">
              {recordSteps.map(([label, status], index) => (
                <li key={label} data-state={index < 2 ? "complete" : index === 2 ? "current" : "pending"}>
                  <span className="wise-record-marker" aria-hidden="true" />
                  <span>{label}</span>
                  <small>{status}</small>
                </li>
              ))}
            </ol>

            <div className="wise-record-review">
              <BrandMark className="wise-record-seal" />
              <p><strong>Human-reviewed</strong><span>Available proof is checked before release.</span></p>
            </div>
            <p className="wise-record-disclaimer">Illustrative record - No live order has been created.</p>
          </aside>
        </div>
      </section>

      <section className="wise-trust" aria-label="Service commitments">
        <div className="container wise-trust-row">
          <p><strong>Scope before payment</strong><span>Understand what is included.</span></p>
          <p><strong>People at every handoff</strong><span>Our team coordinates fulfilment.</span></p>
          <p><strong>A completion record</strong><span>Keep receipts and available proof together.</span></p>
        </div>
      </section>

      <section className="wise-services" id="services">
        <div className="container">
          <div className="wise-section-heading">
            <div>
              <p className="wise-eyebrow">Choose a service</p>
              <h2>Start with the act that matters to you.</h2>
            </div>
            <p>These are the first service journeys being prepared for the As-Sabiqun platform.</p>
          </div>

          <div className="wise-service-list">
            {services.map((service) => (
              <Link className="wise-service-row" href={service.href} key={service.slug} aria-label={`Choose ${service.title}`}>
                <span className="wise-service-number">{service.number}</span>
                <span className="wise-service-name">
                  <strong>{service.title}</strong>
                  <small className="arabic" lang="ar" dir="rtl">{service.arabic}</small>
                </span>
                <span className="wise-service-description">{service.description}</span>
                <span className="wise-service-action">View service <span aria-hidden="true">-&gt;</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="wise-process" id="how-it-works">
        <div className="container wise-process-grid">
          <div className="wise-process-intro">
            <p className="wise-eyebrow">Why this process exists</p>
            <h2>Amanah means making each handoff visible.</h2>
            <p>
              Meaningful service should be clear in its handling as well as sincere in its intention. One connected record helps the customer, our team, and the fulfilment partner know what comes next.
            </p>
            <Link className="wise-text-link" href="/about">Read about As-Sabiqun <span aria-hidden="true">-&gt;</span></Link>
          </div>

          <ol className="wise-process-steps">
            {processSteps.map(([number, title, description]) => (
              <li key={number}>
                <span>{number}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wise-cta">
        <div className="container wise-cta-inner">
          <div>
            <p className="wise-eyebrow">Begin with clarity</p>
            <h2>Choose the service you want to arrange.</h2>
          </div>
          <Link className="btn" href="/services">Choose a service <span aria-hidden="true">-&gt;</span></Link>
        </div>
      </section>
    </div>
  );
}
