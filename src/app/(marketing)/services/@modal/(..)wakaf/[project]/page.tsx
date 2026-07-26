import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Modal } from "@/components/modal";
import { WakafProjectContent } from "@/components/wakaf-project-content";
import { getActiveOfferings } from "@/lib/offerings";
import { wakafProjects, type WakafProjectSlug } from "@/lib/wakaf-projects";

const offeringSlugs: Record<WakafProjectSlug, string> = { "water-pump": "wakaf-water-pump", quran: "wakaf-quran", "food-for-orphans": "wakaf-food-for-orphans" };

export default async function WakafProjectModal({ params }: { params: Promise<{ project: string }> }) {
  const { project: slug } = await params;
  const project = wakafProjects[slug as WakafProjectSlug];
  if (!project) notFound();
  const offering = (await getActiveOfferings()).find((item) => item.slug === offeringSlugs[slug as WakafProjectSlug]);

  return (
    <Modal>
      {offering?.min_amount ? (
        <WakafProjectContent
          initialRequestId={randomUUID()}
          projectId={slug as WakafProjectSlug}
          project={project}
          offering={{ title: offering.title, detail: offering.detail, minimumCents: offering.min_amount }}
        />
      ) : (
        <div className="panel p-8 text-center">
          <h1 className="display text-2xl">{project.title} is temporarily unavailable</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">Please check again shortly or contact us.</p>
          <Link className="btn mt-6" href="/contact">Contact us</Link>
        </div>
      )}
    </Modal>
  );
}
