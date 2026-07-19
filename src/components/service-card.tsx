import Link from "next/link";

export const services = [
  {
    number: "01",
    slug: "korban",
    title: "Korban",
    arabic: "الأضحية",
    description: "Arrange Korban through a guided order, coordinated fulfilment, and documented completion.",
    href: "/korban",
  },
  {
    number: "02",
    slug: "water",
    title: "Wakaf Water Pump",
    arabic: "وقف الماء",
    description: "Contribute towards a clean-water project and follow its journey from order to evidence.",
    href: "/wakaf#water-pump",
  },
  {
    number: "03",
    slug: "quran",
    title: "Wakaf Quran",
    arabic: "وقف القرآن",
    description: "Support Quran distribution with clear project information and a completion record.",
    href: "/wakaf#quran",
  },
  {
    number: "04",
    slug: "orphans",
    title: "Food for Orphans",
    arabic: "إطعام الأيتام",
    description: "Support a coordinated food programme with responsible handling and proof after delivery.",
    href: "/wakaf#food-for-orphans",
  },
] as const;

function ServiceIcon({ type }: { type: (typeof services)[number]["slug"] }) {
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

export function ServiceCard({ service }: { service: (typeof services)[number] }) {
  return (
    <article className="service-card">
      <div className={`service-art service-art-${service.slug}`}>
        <span className="numeral service-number">{service.number}</span>
        <ServiceIcon type={service.slug} />
        <span className="arabic service-arabic" lang="ar" dir="rtl">{service.arabic}</span>
      </div>
      <div className="service-card-copy">
        <div className="flex items-start justify-between gap-4">
          <h3 className="display text-[1.75rem] leading-none">{service.title}</h3>
          <span className="status">Available</span>
        </div>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{service.description}</p>
        <Link className="service-link" href={service.href} aria-label={`Explore ${service.title}`}>
          Explore service <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}
