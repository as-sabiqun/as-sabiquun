import { notFound } from "next/navigation";
import { Modal } from "@/components/modal";
import { WakafProjectContent, wakafProjects, type WakafProjectSlug } from "@/components/wakaf-project-content";

export default async function WakafProjectModal({ params }: { params: Promise<{ project: string }> }) {
  const { project: slug } = await params;
  const project = wakafProjects[slug as WakafProjectSlug];
  if (!project) notFound();

  return (
    <Modal>
      <WakafProjectContent project={project} />
    </Modal>
  );
}
