"use client";

import Image from "next/image";
import Link from "next/link";
import { type KeyboardEvent, useRef, useState } from "react";
import type { CatalogService } from "@/components/service-card";

const serviceMedia: Record<CatalogService["slug"], {
  src: string;
  alt: string;
  caption: string;
  tone: string;
  evidence: string;
}> = {
  korban: {
    src: "/services-korban-care.png",
    alt: "Korban workers caring for a cow at a rural farm",
    caption: "Choose a package and keep the intention connected to its completion record.",
    tone: "coral",
    evidence: "Photos and videos from the completed Korban work",
  },
  water: {
    src: "/landing-water-point.png",
    alt: "A community water point",
    caption: "Support a water project with reviewed location details, photos, and video.",
    tone: "blue",
    evidence: "Photos, videos, and the completed water point location",
  },
  quran: {
    src: "/landing-quran-table.png",
    alt: "Quran copies prepared on a table",
    caption: "Place Quran copies where learning and worship can continue.",
    tone: "green",
    evidence: "Distribution photos and a completion summary",
  },
  orphans: {
    src: "/landing-portrait-community.png",
    alt: "A community member smiling",
    caption: "Help coordinate a shared meal and receive the available delivery record.",
    tone: "pink",
    evidence: "Delivery photos and a completion summary",
  },
};

function Arrow() {
  return <svg viewBox="0 0 32 24" aria-hidden="true"><path d="M2 12h26M20 4l8 8-8 8" /></svg>;
}

function ServicePreview({
  service,
  panelId,
  labelId,
  role = "region",
}: {
  service: CatalogService;
  panelId: string;
  labelId: string;
  role?: "region" | "tabpanel";
}) {
  const media = serviceMedia[service.slug];

  return (
    <div
      className={`asb-service-preview is-${media.tone}`}
      id={panelId}
      role={role}
      aria-labelledby={labelId}
      key={service.slug}
    >
      <div className="asb-service-preview-media">
        <Image
          src={media.src}
          width={1254}
          height={1254}
          sizes="(max-width: 760px) calc(100vw - 30px), 55vw"
          alt={media.alt}
          loading={service.slug === "korban" ? "eager" : "lazy"}
        />
      </div>
      <div className="asb-service-preview-copy">
        <h2>{service.title}</h2>
        <p>{service.description}</p>
        <span>{media.caption}</span>
        <dl className="asb-service-proof" aria-label={`${service.title} completion record`}>
          <div><dt>Partner submits</dt><dd>{media.evidence}</dd></div>
          <div><dt>We review</dt><dd>Required evidence before the record is released</dd></div>
          <div><dt>You receive</dt><dd>Email, Telegram, and project-page access</dd></div>
        </dl>
        <div className="asb-service-preview-action">
          <p><strong>{service.price}</strong><small>{service.priceLabel}</small></p>
          <Link href={service.href}>Choose {service.title} <Arrow /></Link>
        </div>
      </div>
    </div>
  );
}

export function ServiceSelector({ services }: { services: CatalogService[] }) {
  const [activeSlug, setActiveSlug] = useState<CatalogService["slug"]>(services[0].slug);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = services.find((service) => service.slug === activeSlug) ?? services[0];

  function selectByKeyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex = index;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % services.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (index - 1 + services.length) % services.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = services.length - 1;
    else return;

    event.preventDefault();
    setActiveSlug(services[nextIndex].slug);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <>
      <div className="asb-service-directory asb-service-directory-desktop">
        <div className="asb-service-directory-list" role="tablist" aria-label="Available services">
        {services.map((service, index) => {
          const selected = service.slug === active.slug;
          return (
            <button
              key={service.slug}
              type="button"
              role="tab"
              id={`service-tab-${service.slug}`}
              aria-selected={selected}
              aria-controls="service-preview-desktop"
              tabIndex={selected ? 0 : -1}
              className={selected ? "is-active" : undefined}
              ref={(element) => { tabRefs.current[index] = element; }}
              onClick={() => setActiveSlug(service.slug)}
              onKeyDown={(event) => selectByKeyboard(event, index)}
            >
              <span className={`asb-service-directory-mark is-${serviceMedia[service.slug].tone}`} aria-hidden="true" />
              <span className="asb-service-directory-name">{service.title}</span>
              <span className="asb-service-directory-price">{service.price}</span>
              <Arrow />
            </button>
          );
        })}
        </div>
        <ServicePreview
          service={active}
          panelId="service-preview-desktop"
          labelId={`service-tab-${active.slug}`}
          role="tabpanel"
        />
      </div>

      <div className="asb-service-directory-mobile" aria-label="Available services">
        {services.map((service) => {
          const selected = service.slug === active.slug;
          return (
            <div className={selected ? "is-active" : undefined} key={service.slug}>
              <button
                type="button"
                id={`service-mobile-${service.slug}`}
                aria-expanded={selected}
                aria-controls={`service-preview-mobile-${service.slug}`}
                onClick={() => setActiveSlug(service.slug)}
              >
                <span className={`asb-service-directory-mark is-${serviceMedia[service.slug].tone}`} aria-hidden="true" />
                <span className="asb-service-directory-name">{service.title}</span>
                <span className="asb-service-directory-price">{service.price}</span>
                <Arrow />
              </button>
              {selected && (
                <ServicePreview
                  service={service}
                  panelId={`service-preview-mobile-${service.slug}`}
                  labelId={`service-mobile-${service.slug}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
