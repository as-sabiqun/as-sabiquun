import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WakafProjectContent } from "@/components/wakaf-project-content";
import { getActiveOfferings } from "@/lib/offerings";
import { wakafProjects, type WakafProjectSlug } from "@/lib/wakaf-projects";

const offeringCategories: Record<WakafProjectSlug, "water" | "quran" | "orphans"> = { "water-pump": "water", quran: "quran", "food-for-orphans": "orphans" };

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(wakafProjects).map((project) => ({ project }));
}

export default async function WakafProjectPage({ params }: { params: Promise<{ project: string }> }) {
  const { project: slug } = await params;
  const project = wakafProjects[slug as WakafProjectSlug];
  if (!project) notFound();
  const offerings = (await getActiveOfferings()).filter((item) =>
    item.service_type === "wakaf" && item.category_slug === offeringCategories[slug as WakafProjectSlug] && item.min_amount
  );

  return (
    <section className="product-page">
      <div className="container">
        <nav className="breadcrumb">
          <Link href="/wakaf">Wakaf</Link>
          <span aria-hidden="true">/</span>
          <span>{project.title}</span>
        </nav>

        <div className="mt-6">
          {offerings.length ? (
            <WakafProjectContent
              initialRequestId={randomUUID()}
              projectId={slug as WakafProjectSlug}
              project={project}
              offerings={offerings.map((offering) => ({ id: offering.id, title: offering.title, detail: offering.detail, minimumCents: offering.min_amount! }))}
            />
          ) : (
            <div className="panel p-8 text-center">
              <h1 className="display text-3xl">{project.title} is temporarily unavailable</h1>
              <p className="mt-3 text-sm text-[var(--muted)]">Contribution settings are being updated. Please check again shortly or contact us.</p>
              <Link className="btn mt-6" href="/contact">Contact us</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
