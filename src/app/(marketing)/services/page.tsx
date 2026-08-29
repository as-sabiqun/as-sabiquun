import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { catalogServicesFrom, type CatalogService } from "@/components/service-card";
import { getActiveOfferings } from "@/lib/offerings";
import "./services.css";

export const metadata: Metadata = {
  title: "Services",
  description: "Choose a Korban or Wakaf service and follow it from your intention to a reviewed completion record.",
};

const serviceMedia: Record<CatalogService["slug"], { src: string; alt: string; note: string }> = {
  korban: { src: "/landing-hero-volunteers.png", alt: "Volunteers preparing support for a community programme", note: "Choose a package and share the intention behind it." },
  water: { src: "/landing-water-point.png", alt: "A community water point", note: "Support a water project and receive its reviewed location record." },
  quran: { src: "/landing-quran-table.png", alt: "Quran copies prepared on a table", note: "Help place Quran copies where learning and worship continue." },
  orphans: { src: "/landing-portrait-community.png", alt: "A community member smiling", note: "Help coordinate a shared meal and receive the delivery record." },
};

function Arrow() {
  return <svg viewBox="0 0 32 24" aria-hidden="true"><path d="M2 12h26M20 4l8 8-8 8" /></svg>;
}

function ServiceMark({ slug }: { slug: CatalogService["slug"] }) {
  if (slug === "water") return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8C24 21 17 30 17 41a15 15 0 0 0 30 0C47 30 40 21 32 8Z" /><path d="M24 42c2 5 6 7 11 7" /></svg>;
  if (slug === "quran") return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 17c9-3 17-1 23 5v31c-6-6-14-8-23-5V17ZM55 17c-9-3-17-1-23 5v31c6-6 14-8 23-5V17Z" /><path d="M15 26c5-1 9 0 13 3M49 26c-5-1-9 0-13 3" /></svg>;
  if (slug === "orphans") return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 51S12 40 12 24c0-7 5-11 11-11 4 0 7 2 9 6 2-4 5-6 9-6 6 0 11 4 11 11 0 16-20 27-20 27Z" /><path d="M21 37c7-4 15-4 22 0" /></svg>;
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M15 42c2-11 9-19 17-19 9 0 16 8 17 19M20 24c-3-1-6-4-7-8 6 0 10 2 13 6M44 24c3-1 6-4 7-8-6 0-10 2-13 6M23 42v7M41 42v7" /><path d="M27 32h.1M37 32h.1" /></svg>;
}

export default async function ServicesPage() {
  const liveServices = catalogServicesFrom(await getActiveOfferings());

  return (
    <div className="asb-services-page">
      <section className="asb-services-hero" aria-labelledby="services-page-title">
        <div className="asb-services-hero-orbit" aria-hidden="true"><i /><i /><i /></div>
        <div className="asb-services-hero-copy">
          <h1 id="services-page-title">Choose the service that fits your intention.</h1>
          <p>Begin with Korban or Wakaf. We organise the work, review the available field evidence, and keep the completion record connected to you.</p>
          <a href="#available-services" className="asb-services-scroll">See available services <Arrow /></a>
        </div>
      </section>

      <section className="asb-services-index" id="available-services" aria-labelledby="available-services-title">
        <div className="asb-services-index-head">
          <h2 id="available-services-title">Four ways to begin.</h2>
          <p>Each service has its own request flow, but the promise is consistent: a clear next step now and a reviewed record when the work is complete.</p>
        </div>

        {liveServices.length ? (
          <div className="asb-service-chapters">
            {liveServices.map((service) => {
              const media = serviceMedia[service.slug];
              return (
                <article className={`asb-service-chapter asb-service-chapter-${service.slug}`} key={service.slug}>
                  <div className="asb-service-chapter-copy">
                    <ServiceMark slug={service.slug} />
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <div className="asb-service-chapter-action">
                      <span><strong>{service.price}</strong><small>{service.priceLabel}</small></span>
                      <Link href={service.href} aria-label={`Choose ${service.title}`}>Choose this service <Arrow /></Link>
                    </div>
                  </div>
                  <Link href={service.href} className="asb-service-chapter-media" aria-label={`Learn about ${service.title}`}>
                    <Image src={media.src} width={1254} height={1254} sizes="(max-width: 860px) 100vw, 50vw" alt={media.alt} />
                    <span>{media.note}</span>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="asb-services-empty">
            <h3>No services are available right now.</h3>
            <p>Please check again shortly, or speak with us about what you are hoping to arrange.</p>
            <Link href="/contact">Ask a question <Arrow /></Link>
          </div>
        )}
      </section>

      <section className="asb-services-process" aria-labelledby="services-process-title">
        <div className="asb-services-process-copy">
          <h2 id="services-process-title">From intention to a record you can return to.</h2>
          <p>The exact work changes from one service to another. The care around it does not.</p>
        </div>
        <ol>
          <li><span>Choose</span><strong>Start with the service and package that are right for you.</strong></li>
          <li><span>We coordinate</span><strong>An approved fulfilment partner carries out the work and submits evidence.</strong></li>
          <li><span>You receive</span><strong>We review what is provided and return the available completion record to you.</strong></li>
        </ol>
      </section>

      <section className="asb-services-closing" aria-labelledby="services-closing-title">
        <div>
          <h2 id="services-closing-title">Not sure where your intention fits?</h2>
          <p>Tell us what you are hoping to arrange. We will help you find the clearest next step.</p>
        </div>
        <Link href="/contact">Speak with us <Arrow /></Link>
      </section>
    </div>
  );
}
