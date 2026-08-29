"use client";

import Image from "next/image";
import Link from "next/link";
import { type KeyboardEvent, useRef, useState } from "react";
import type { CatalogService } from "@/components/service-card";

const serviceMedia: Record<CatalogService["slug"], { src: string; alt: string; caption: string; tone: string }> = {
  korban: {
    src: "/services-korban-care.png",
    alt: "Korban workers caring for a cow at a rural farm",
    caption: "Choose a package and keep the intention connected to its completion record.",
    tone: "coral",
  },
  water: {
    src: "/landing-water-point.png",
    alt: "A community water point",
    caption: "Support a water project with reviewed location details, photos, and video.",
    tone: "blue",
  },
  quran: {
    src: "/landing-quran-table.png",
    alt: "Quran copies prepared on a table",
    caption: "Place Quran copies where learning and worship can continue.",
    tone: "green",
  },
  orphans: {
    src: "/landing-portrait-community.png",
    alt: "A community member smiling",
    caption: "Help coordinate a shared meal and receive the available delivery record.",
    tone: "pink",
  },
};

function Arrow() {
  return <svg viewBox="0 0 32 24" aria-hidden="true"><path d="M2 12h26M20 4l8 8-8 8" /></svg>;
}

export function ServiceSelector({ services }: { services: CatalogService[] }) {
  const [activeSlug, setActiveSlug] = useState<CatalogService["slug"]>(services[0].slug);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = services.find((service) => service.slug === activeSlug) ?? services[0];
  const media = serviceMedia[active.slug];

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
    <div className="asb-service-directory">
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
              aria-controls="service-preview"
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

      <div
        className={`asb-service-preview is-${media.tone}`}
        id="service-preview"
        role="tabpanel"
        aria-labelledby={`service-tab-${active.slug}`}
        key={active.slug}
      >
        <div className="asb-service-preview-media">
          <Image
            src={media.src}
            width={1254}
            height={1254}
            sizes="(max-width: 860px) 100vw, 55vw"
            alt={media.alt}
            loading="eager"
            unoptimized
          />
        </div>
        <div className="asb-service-preview-copy">
          <h2>{active.title}</h2>
          <p>{active.description}</p>
          <span>{media.caption}</span>
          <div>
            <p><strong>{active.price}</strong><small>{active.priceLabel}</small></p>
            <Link href={active.href}>Choose {active.title} <Arrow /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
