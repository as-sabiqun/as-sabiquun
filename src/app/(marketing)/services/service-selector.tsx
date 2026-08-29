"use client";

import Image from "next/image";
import Link from "next/link";
import { type KeyboardEvent, useRef, useState } from "react";
import type { CatalogService } from "@/components/service-card";

const serviceMedia: Record<CatalogService["slug"], {
  src: string;
  alt: string;
  tone: string;
  evidence: string;
}> = {
  korban: {
    src: "/services-korban-care.png",
    alt: "Korban workers caring for a cow at a rural farm",
    tone: "coral",
    evidence: "Completion record with reviewed photos and videos",
  },
  water: {
    src: "/landing-water-point.png",
    alt: "A community water point",
    tone: "blue",
    evidence: "Reviewed photos, videos, and the completed location",
  },
  quran: {
    src: "/landing-quran-table.png",
    alt: "Quran copies prepared on a table",
    tone: "green",
    evidence: "Distribution photos and a completion record",
  },
  orphans: {
    src: "/landing-portrait-community.png",
    alt: "A community member smiling",
    tone: "pink",
    evidence: "Delivery photos and a completion record",
  },
};

function Arrow() {
  return <svg viewBox="0 0 32 24" aria-hidden="true"><path d="M2 12h26M20 4l8 8-8 8" /></svg>;
}

function ServiceGlyph({ type }: { type: CatalogService["slug"] }) {
  if (type === "water") {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4.5c-3.6 5.8-7.4 10.2-7.4 16a7.4 7.4 0 0 0 14.8 0c0-5.8-3.8-10.2-7.4-16Z" /><path d="M12.4 21.2c.7 2 2 3 4.1 3.4" /></svg>;
  }
  if (type === "quran") {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4.5 7.5c4.6-1.4 8.4-.4 11.5 2.6v16c-3.1-3-6.9-4-11.5-2.6v-16Z" /><path d="M27.5 7.5c-4.6-1.4-8.4-.4-11.5 2.6v16c3.1-3 6.9-4 11.5-2.6v-16Z" /></svg>;
  }
  if (type === "orphans") {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 17h20M8 17a8 8 0 0 0 16 0M16 8v5M11.5 10.5 14 13M20.5 10.5 18 13" /></svg>;
  }
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7.5 21c.8-5.5 4-9 8.5-9s7.7 3.5 8.5 9M10.5 12.5C8.7 12 7.2 10.6 6.5 8.2c3.1 0 5.3 1.1 6.7 3.2M21.5 12.5c1.8-.5 3.3-1.9 4-4.3-3.1 0-5.3 1.1-6.7 3.2M11 21v4M21 21v4" /></svg>;
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
        <div className="asb-service-preview-text">
          <h2>{service.title}</h2>
          <p>{service.description}</p>
          <span>{media.evidence}</span>
        </div>
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
              <span className={`asb-service-directory-mark is-${serviceMedia[service.slug].tone}`} aria-hidden="true"><ServiceGlyph type={service.slug} /></span>
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
                <span className={`asb-service-directory-mark is-${serviceMedia[service.slug].tone}`} aria-hidden="true"><ServiceGlyph type={service.slug} /></span>
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
