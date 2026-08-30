import Image from "next/image";
import Link from "next/link";

export interface CatalogService {
  number: string;
  slug: "korban" | "water" | "quran" | "orphans";
  title: string;
  description: string;
  href: string;
  price: string;
  priceLabel: string;
}

export const services: CatalogService[] = [
  {
    number: "01",
    slug: "korban",
    title: "Korban",
    description: "Choose your Korban package. We arrange it and send you proof when it is done.",
    href: "/korban",
    price: "S$280",
    priceLabel: "per share",
  },
  {
    number: "02",
    slug: "water",
    title: "Wakaf Water Pump",
    description: "Help provide clean water. We show you where it was built and send photos and videos.",
    href: "/wakaf/water-pump",
    price: "From S$25",
    priceLabel: "minimum",
  },
  {
    number: "03",
    slug: "quran",
    title: "Wakaf Quran",
    description: "Give Qurans to people who need them. We send you a report after distribution.",
    href: "/wakaf/quran",
    price: "From S$10",
    priceLabel: "minimum",
  },
  {
    number: "04",
    slug: "orphans",
    title: "Food for Orphans",
    description: "Help provide meals for orphans. We send photos and a report after delivery.",
    href: "/wakaf/food-for-orphans",
    price: "From S$50",
    priceLabel: "minimum",
  },
];

export function catalogServicesFrom(offerings: { category_slug: CatalogService["slug"]; unit_amount: number | null; min_amount: number | null }[]) {
  return services.flatMap((service) => {
    const amounts = offerings.filter((offering) => offering.category_slug === service.slug)
      .map((offering) => offering.unit_amount ?? offering.min_amount).filter((amount): amount is number => amount !== null);
    if (!amounts.length) return [];
    const price = `From S$${(Math.min(...amounts) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    return [{
      ...service,
      price,
      priceLabel: service.slug === "korban" ? "per share · starting price" : "minimum contribution",
    }];
  });
}

function ServiceIcon({ type }: { type: CatalogService["slug"] }) {
  if (type === "water") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 9C25 20 17 29 17 40a15 15 0 0 0 30 0C47 29 39 20 32 9Z" /><path d="M24 42c2 5 6 7 11 7" /></svg>;
  }
  if (type === "quran") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 17c9-3 17-1 23 5v31c-6-6-14-8-23-5V17Z" /><path d="M55 17c-9-3-17-1-23 5v31c6-6 14-8 23-5V17Z" /><path d="M15 26c5-1 9 0 13 3M49 26c-5-1-9 0-13 3" /></svg>;
  }
  if (type === "orphans") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 51S12 40 12 24c0-7 5-11 11-11 4 0 7 2 9 6 2-4 5-6 9-6 6 0 11 4 11 11 0 16-20 27-20 27Z" /><path d="M21 37c7-4 15-4 22 0" /></svg>;
  }
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M15 42c2-11 9-19 17-19 9 0 16 8 17 19" /><path d="M20 24c-3-1-6-4-7-8 6 0 10 2 13 6M44 24c3-1 6-4 7-8-6 0-10 2-13 6M23 42v7M41 42v7M27 32h.1M37 32h.1" /></svg>;
}

export function CatalogCard({ service }: { service: CatalogService }) {
  const media: Record<CatalogService["slug"], { src: string; alt: string; evidence: string }> = {
    korban: {
      src: "/services-korban-care.png",
      alt: "Korban workers caring for a cow at a rural farm",
      evidence: "Reviewed photos, video, and completion record",
    },
    water: {
      src: "/landing-water-point.png",
      alt: "A completed community water point",
      evidence: "Reviewed photos, video, and completed location",
    },
    quran: {
      src: "/landing-quran-table.png",
      alt: "Quran copies prepared for distribution",
      evidence: "Distribution photos and completion record",
    },
    orphans: {
      src: "/landing-portrait-community.png",
      alt: "A smiling community member",
      evidence: "Delivery photos and completion record",
    },
  };
  const serviceMedia = media[service.slug];

  return (
    <Link
      href={service.href}
      className={`asb-service-card is-${service.slug}`}
      aria-label={`View ${service.title}, ${service.price}`}
    >
      <div className="asb-service-card-copy">
        <div className="asb-service-card-top" aria-hidden="true">
          <span className="asb-service-card-mark">
            <ServiceIcon type={service.slug} />
          </span>
          <span className="asb-service-card-action">
            <svg viewBox="0 0 32 24"><path d="M2 12h26M20 4l8 8-8 8" /></svg>
          </span>
        </div>
        <h3>{service.title}</h3>
        <p>{service.description}</p>
        <span className="asb-service-card-price">
          <strong>{service.price}</strong>
          <small>{service.priceLabel}</small>
        </span>
      </div>
      <div className="asb-service-card-media">
        <Image
          src={serviceMedia.src}
          alt={serviceMedia.alt}
          fill
          sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1200px) 50vw, 660px"
        />
        <span className="asb-service-card-evidence">
          <i aria-hidden="true" />
          {serviceMedia.evidence}
        </span>
      </div>
    </Link>
  );
}
