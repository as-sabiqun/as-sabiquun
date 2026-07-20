import type { Metadata } from "next";
import Link from "next/link";
import { WakafForm } from "@/components/forms";

export const metadata: Metadata = {
  title: "Wakaf & Community Giving",
  description: "Explore Wakaf Water Pump, Wakaf Quran, and Food for Orphans with As-Sābiqūn.",
};

const projects = [
  ["water-pump", "01", "Wakaf Water Pump", "A clean-water project coordinated with a fulfilment partner and documented after completion."],
  ["quran", "02", "Wakaf Quran", "Quran distribution arranged through one clear request and completion record."],
  ["food-for-orphans", "03", "Food for Orphans", "A community food programme supported through responsible coordination and available proof."],
] as const;

export default function WakafPage() {
  return (
    <>
      <section className="service-detail-hero wakaf-hero">
        <div className="container grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="eyebrow">Wakaf & community giving · الوَقْف</p>
            <h1 className="display mt-6 text-[clamp(3.3rem,7vw,6.3rem)] leading-[.88]">Give today.<br /><span className="text-[var(--teal)]">Let the good continue.</span></h1>
            <p className="lead mt-8 max-w-xl">Choose a project, make a contribution, and follow a coordinated journey towards documented service.</p>
          </div>
          <div className="service-detail-art wakaf-detail-art">
            <span className="numeral">02—04</span>
            <div className="detail-arch"><b className="arabic" lang="ar" dir="rtl">صدقة جارية</b><small>Continuing benefit</small></div>
          </div>
        </div>
      </section>

      <section className="section project-overview-section">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow">Choose a cause</p><h2 className="section-title mt-4">Three projects. One careful process.</h2></div>
            <p className="lead max-w-md">Project details are placeholders for now and will be confirmed with the relevant fulfilment partners before launch.</p>
          </div>
          <div className="project-overview-grid mt-14">
            {projects.map(([id, number, title, description]) => (
              <article id={id} key={id}>
                <span className="numeral">{number}</span>
                <h3 className="display">{title}</h3>
                <p>{description}</p>
                <Link href={`/wakaf/${id}`}>View project <span aria-hidden="true">→</span></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-[var(--teal-soft)]" id="contribute">
        <div className="container grid items-start gap-14 lg:grid-cols-[.72fr_1.28fr]">
          <div className="service-intro lg:sticky lg:top-28">
            <p className="eyebrow">Contribution preview</p>
            <h2 className="section-title mt-4">Choose, dedicate, and review.</h2>
            <p className="lead mt-6">This form demonstrates how a supporter will choose a project, enter their details, and continue to a clear order summary.</p>
            <ol className="service-checklist mt-9">
              <li><span>1</span>Select a project</li>
              <li><span>2</span>Choose the contribution</li>
              <li><span>3</span>Add an optional dedication</li>
            </ol>
            <div className="preview-note mt-9"><strong>Preview content</strong><p>Project scope, minimum contributions, and fulfilment evidence are placeholders. No payment or service is carried out here.</p></div>
          </div>
          <WakafForm />
        </div>
      </section>
    </>
  );
}
