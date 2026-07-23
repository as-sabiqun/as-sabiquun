import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wakaf & Community Giving",
  description: "Explore Wakaf Water Pump, Wakaf Quran, and Food for Orphans with As-Sabiqun.",
};

const projects = [
  { slug: "water-pump", number: "02", title: "Wakaf Water Pump", description: "A clean-water project coordinated with a fulfilment partner and documented after completion.", minimum: "S$25" },
  { slug: "quran", number: "03", title: "Wakaf Quran", description: "Quran distribution arranged through one clear request and completion record.", minimum: "S$10" },
  { slug: "food-for-orphans", number: "04", title: "Food for Orphans", description: "A community food programme supported through responsible coordination and available proof.", minimum: "S$50" },
];

export default function WakafPage() {
  return (
    <>
      <section className="catalog-header">
        <div className="container">
          <p className="eyebrow-label">Wakaf & community giving</p>
          <h1 className="display">Give today. Let the good continue.</h1>
          <p className="lede">Choose a cause, make a contribution, and follow a coordinated journey towards documented service.</p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container">
          <div className="grid gap-4 md:grid-cols-3">
            {projects.map((project) => (
              <Link href={`/wakaf/${project.slug}`} key={project.slug} className="card flex min-h-[220px] flex-col p-6">
                <span className="numeral text-[.7rem]" style={{ color: "var(--gold)" }}>{project.number}</span>
                <h3 className="display mt-4 text-xl">{project.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-[var(--muted)]">{project.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-4">
                  <small className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">From {project.minimum}</small>
                  <span aria-hidden="true" style={{ color: "var(--gold)" }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
