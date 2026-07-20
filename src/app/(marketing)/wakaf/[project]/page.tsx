import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WakafForm } from "@/components/forms";

const projects = [
  {
    slug: "water-pump",
    offeringSlug: "wakaf-water",
    number: "02",
    title: "Wakaf Water Pump",
    description: "Support a clean-water project through a guided contribution and documented completion record.",
    headline: "A source of water, built to keep serving.",
    lead: "Contribute towards a community water project, add an optional dedication, and receive the available installation record after review.",
    facts: [
      ["Defined project", "The location and scope stay connected to the contribution."],
      ["Optional nameplate", "Dedication details can be prepared for the project record."],
      ["Installation proof", "Available photos and video are checked before release."],
    ],
    formTitle: "Support a clean-water project.",
    formCopy: "This preview shows how a contribution and dedication will be recorded against one water project.",
    steps: ["Enter your contribution", "Add an optional dedication", "Review the project record"],
    included: [
      ["Contribution receipt", "Your amount, details, and project reference in one record."],
      ["Dedication record", "The supplied name stays attached to the correct project."],
      ["Completion evidence", "Available installation and water-flow media after review."],
    ],
  },
  {
    slug: "quran",
    offeringSlug: "wakaf-quran",
    number: "03",
    title: "Wakaf Quran",
    description: "Support Quran distribution through a clear contribution journey and completion record.",
    headline: "Place Qurans where learning continues.",
    lead: "Choose a contribution, include an optional dedication, and keep the distribution journey connected from request to reviewed proof.",
    facts: [
      ["Clear allocation", "The contribution remains connected to the selected programme."],
      ["Optional dedication", "A name or intention can be recorded with the request."],
      ["Distribution proof", "Available programme media is checked before release."],
    ],
    formTitle: "Support Quran distribution.",
    formCopy: "This preview demonstrates how a supporter will contribute and keep their dedication connected to the distribution record.",
    steps: ["Choose the contribution", "Add an optional dedication", "Review the distribution record"],
    included: [
      ["Contribution receipt", "Your amount, contact details, and reference together."],
      ["Dedication record", "The intended name remains connected to the contribution."],
      ["Distribution evidence", "Available photos or video after operational review."],
    ],
  },
  {
    slug: "food-for-orphans",
    offeringSlug: "food-for-orphans",
    number: "04",
    title: "Food for Orphans",
    description: "Support a coordinated food programme with a clear contribution and completion record.",
    headline: "Help place a complete meal where it is needed.",
    lead: "Contribute towards a coordinated food programme and follow the record from request through delivery and reviewed proof.",
    facts: [
      ["Programme scope", "The contribution stays connected to a defined food programme."],
      ["Coordinated delivery", "The operations team manages the fulfilment handoff."],
      ["Delivery proof", "Privacy-conscious evidence is checked before release."],
    ],
    formTitle: "Support a community food programme.",
    formCopy: "This preview shows how a contribution will be connected to a programme, fulfilment partner, and completion record.",
    steps: ["Choose the contribution", "Add an optional dedication", "Review the programme record"],
    included: [
      ["Contribution receipt", "Your contribution and programme reference in one place."],
      ["Programme record", "The delivery scope remains connected throughout fulfilment."],
      ["Completion evidence", "Available privacy-conscious delivery media after review."],
    ],
  },
] as const;

type ProjectPageProps = { params: Promise<{ project: string }> };

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ project: slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { project: slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) return {};
  return { title: project.title, description: project.description };
}

export default async function WakafProjectPage({ params }: ProjectPageProps) {
  const { project: slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();

  return (
    <>
      <section className="service-detail-hero wakaf-hero">
        <div className="container grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="eyebrow">{project.title} - continuing benefit</p>
            <h1 className="display mt-6 max-w-3xl text-[clamp(3.3rem,7vw,6.3rem)] leading-[.88]">{project.headline}</h1>
            <p className="lead mt-8 max-w-xl">{project.lead}</p>
          </div>
          <div className="service-detail-art wakaf-detail-art">
            <span className="numeral">{project.number}</span>
            <div className="detail-arch"><b className="display text-center text-3xl leading-tight">{project.title}</b><small>Amanah record</small></div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label={`${project.title} service features`}>
        <div className="container trust-strip-grid">
          {project.facts.map(([title, detail], index) => <p key={title}><span>0{index + 1}</span><strong>{title}</strong><small>{detail}</small></p>)}
        </div>
      </section>

      <section className="section" id="contribute">
        <div className="container grid items-start gap-14 lg:grid-cols-[.72fr_1.28fr]">
          <div className="service-intro lg:sticky lg:top-28">
            <p className="eyebrow">Contribution preview</p>
            <h2 className="section-title mt-4">{project.formTitle}</h2>
            <p className="lead mt-6">{project.formCopy}</p>
            <ol className="service-checklist mt-9">
              {project.steps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}
            </ol>
            <div className="preview-note mt-9"><strong>Preview content</strong><p>Project scope, contribution amounts, and fulfilment evidence will be confirmed before launch. No payment or service is carried out here.</p></div>
          </div>
          <WakafForm offeringSlug={project.offeringSlug} />
        </div>
      </section>

      <section className="section bg-[var(--teal-soft)]">
        <div className="container grid gap-14 lg:grid-cols-[.75fr_1.25fr]">
          <div><p className="eyebrow">Your record</p><h2 className="section-title mt-4">The important details, kept together.</h2></div>
          <div className="included-grid">
            {project.included.map(([title, description], index) => <article key={title}><span className="numeral">0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}
          </div>
        </div>
      </section>
    </>
  );
}
