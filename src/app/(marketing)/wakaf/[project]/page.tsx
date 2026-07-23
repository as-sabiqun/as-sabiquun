"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import { WakafProjectContent, wakafProjects, type WakafProjectSlug } from "@/components/wakaf-project-content";

export default function WakafProjectPage({ params }: { params: Promise<{ project: string }> }) {
  const { project: slug } = use(params);
  const project = wakafProjects[slug as WakafProjectSlug];
  if (!project) notFound();

  return (
    <section className="py-10 lg:py-14">
      <div className="container">
        <nav className="breadcrumb">
          <Link href="/wakaf">Wakaf</Link>
          <span aria-hidden="true">/</span>
          <span>{project.title}</span>
        </nav>

        <div className="mt-6">
          <WakafProjectContent projectId={slug as WakafProjectSlug} project={project} />
        </div>
      </div>
    </section>
  );
}
