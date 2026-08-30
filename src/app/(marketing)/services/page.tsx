import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CatalogCard, catalogServicesFrom } from "@/components/service-card";
import { getActiveOfferings } from "@/lib/offerings";
import "./services.css";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Choose an As-Sabiquun service and follow each step through to a reviewed Amanah completion record.",
};

function Arrow() {
  return (
    <svg viewBox="0 0 32 24" aria-hidden="true">
      <path d="M2 12h26M20 4l8 8-8 8" />
    </svg>
  );
}

function RecordMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3.5h7l3 3V20.5H7zM14 3.5v3h3M9.8 11h4.4M9.8 14h4.4M9.8 17h2.6" />
    </svg>
  );
}

function CompletionRecordPreview() {
  return (
    <article className="asb-completion-record" aria-label="Preview of an Amanah completion record">
      <div className="asb-completion-record-topline">
        <span className="asb-completion-record-mark"><RecordMark /></span>
        <span>
          <small>Amanah</small>
          <strong>Completion record</strong>
        </span>
        <i><b aria-hidden="true">✓</b> Reviewed</i>
      </div>

      <div className="asb-completion-record-heading">
        <p>Record preview</p>
        <h3>Your fulfilled service,<br />kept in one place.</h3>
      </div>

      <dl className="asb-completion-record-facts">
        <div><dt>Service</dt><dd>Your chosen service</dd></div>
        <div><dt>Details</dt><dd>Names or project location</dd></div>
        <div><dt>Review</dt><dd><span aria-hidden="true" /> Evidence checked</dd></div>
      </dl>

      <div className="asb-completion-record-media">
        <p><span>Reviewed media</span><small>Photos or video</small></p>
        <div>
          <figure><Image src="/landing-water-point.png" alt="" fill sizes="170px" /></figure>
          <figure><Image src="/landing-quran-table.png" alt="" fill sizes="170px" /></figure>
        </div>
      </div>

      <div className="asb-completion-record-retained">
        <span aria-hidden="true"><RecordMark /></span>
        <p><strong>Retained with your project</strong><small>Return to the completion record from your project page.</small></p>
      </div>
    </article>
  );
}

export default async function ServicesPage() {
  const services = catalogServicesFrom(await getActiveOfferings());

  return (
    <div className="asb-services-page">
      <section className="asb-services-hero" aria-labelledby="services-page-title">
        <div className="asb-services-hero-copy">
          <p className="asb-services-eyebrow">As-Sabiquun services</p>
          <h1 id="services-page-title">Choose a service.<br />Follow every step.</h1>
          <p className="asb-services-summary">
            Your request is arranged through an approved fulfilment partner. We review the submitted
            evidence before your Amanah completion record is released.
          </p>
          <a className="asb-services-primary" href="#service-directory">
            Explore services <Arrow />
          </a>
        </div>

      </section>

      <section id="service-directory" className="asb-services-catalogue" aria-labelledby="services-catalogue-title">
        <div className="asb-services-catalogue-intro">
          <p className="asb-services-section-label">Available services</p>
          <h2 id="services-catalogue-title">Four ways to begin.</h2>
          <p className="asb-services-catalogue-summary">
            Choose the service that fits your intention. Every completed request comes with a reviewed record of the work.
          </p>
        </div>

        {services.length ? (
          <div className={`asb-services-grid has-${services.length}-services`}>
            {services.map((service) => <CatalogCard key={service.slug} service={service} />)}
          </div>
        ) : (
          <div className="asb-services-empty">
            <span className="asb-services-empty-mark" aria-hidden="true"><RecordMark /></span>
            <div>
              <h3>Services are being prepared.</h3>
              <p>There are no active services to display right now. Speak with us and we’ll help you find the right next step.</p>
            </div>
            <Link href="/contact">Contact us <Arrow /></Link>
          </div>
        )}
      </section>

      <section className="asb-services-process" aria-labelledby="services-process-title">
        <div className="asb-services-process-intro">
          <p className="asb-services-section-label">How it works</p>
          <h2 id="services-process-title">From your intention to a reviewed record.</h2>
          <p>
            One connected process carries your request from the details you provide to the record you can return to.
          </p>
        </div>

        <ol className="asb-process-grid">
          <li className="asb-process-card is-arrange">
            <span className="asb-process-index"><b>01</b> Arrange</span>
            <h3>Arrange</h3>
            <p>Choose a service and provide the details needed for your request.</p>
          </li>
          <li className="asb-process-card is-fulfil">
            <span className="asb-process-index"><b>02</b> Fulfil</span>
            <h3>Fulfil</h3>
            <p>An approved partner carries out the work and submits the required evidence.</p>
          </li>
          <li className="asb-process-card is-review">
            <span className="asb-process-index"><b>03</b> Review</span>
            <h3>Review and receive</h3>
            <p>Evidence is checked and the completion record is added to your project.</p>
          </li>
        </ol>
      </section>

      <section className="asb-services-evidence" aria-labelledby="services-evidence-title">
        <div className="asb-evidence-panel">
          <div className="asb-evidence-heading">
            <p className="asb-services-section-label">Reviewed evidence</p>
            <h2 id="services-evidence-title">A promise should come with a record.</h2>
            <p className="asb-evidence-summary">See the evidence that was reviewed and keep the completed work with the project it belongs to.</p>
            <ul className="asb-evidence-deliverables">
              <li>
                <span className="asb-evidence-icon" aria-hidden="true">01</span>
                <div><strong>Reviewed photos or video</strong><p>Completion media appears after the submitted work is approved.</p></div>
              </li>
              <li>
                <span className="asb-evidence-icon" aria-hidden="true">02</span>
                <div><strong>Names or location details</strong><p>The record keeps the details relevant to your chosen service.</p></div>
              </li>
              <li>
                <span className="asb-evidence-icon" aria-hidden="true">03</span>
                <div><strong>A retained completion record</strong><p>The reviewed record remains available on your project page.</p></div>
              </li>
            </ul>
          </div>

          <CompletionRecordPreview />
        </div>
      </section>

      <section id="services-faq" className="asb-services-faq" aria-labelledby="services-faq-title">
        <div className="asb-services-faq-heading">
          <p className="asb-services-section-label">Questions</p>
          <h2 id="services-faq-title">Before you choose.</h2>
        </div>

        <div className="asb-services-faq-list">
          <details>
            <summary>How is the price for a service calculated?<span aria-hidden="true" /></summary>
            <p>Current package names and prices come from the active offerings for each service. Your checkout shows the amount for the package and quantity you select before payment.</p>
          </details>
          <details>
            <summary>What happens after payment?<span aria-hidden="true" /></summary>
            <p>After payment is confirmed, your project moves through fulfilment, partner assignment, work in progress, evidence review, and completion-report delivery. You can follow those updates from your project page.</p>
          </details>
          <details>
            <summary>Is the evidence the same for every service?<span aria-hidden="true" /></summary>
            <p>No. The evidence shown depends on the service and the approved submission. A record may include photos or video, relevant names, and project location details.</p>
          </details>
          <details>
            <summary>Can I return to a completed project record?<span aria-hidden="true" /></summary>
            <p>Yes. Sign in and open the project from your dashboard. Its approved completion details, available evidence, and completion report remain together on the project page.</p>
          </details>
          <details>
            <summary>What if a service is unavailable?<span aria-hidden="true" /></summary>
            <p>Only active offerings appear in the service directory. If nothing is available, the page will say that services are being prepared and direct you to contact As-Sabiquun for the next step.</p>
          </details>
        </div>
      </section>

      <section id="services-closing" className="asb-services-closing" aria-labelledby="services-closing-title">
        <div className="asb-services-closing-inner">
          <p className="asb-services-closing-label">Your next step</p>
          <h2 id="services-closing-title">Ready to begin<br />with clarity?</h2>
          <a className="asb-services-closing-action" href="#service-directory">
            Choose a service <Arrow />
          </a>
        </div>
      </section>
    </div>
  );
}
