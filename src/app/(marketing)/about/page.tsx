import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About",
  description: "Learn how As-Sabiquun carries Islamic services from intention to completion through approved partners, reviewed evidence, and retained project records.",
};

const principles = [
  ["Amanah", "We treat each request as a trust: its scope, money, handoffs, and evidence remain connected in one record."],
  ["Clarity", "Customers, partners, and administrators see the information they need without hidden steps or vague statuses."],
  ["Verification", "A project is only marked complete after its evidence is reviewed and the completion record is added to the customer project."],
] as const;

const platformServices = [
  {
    slug: "korban",
    title: "Korban",
    description: "Choose a Korban package and keep participant details connected through to reviewed proof.",
    href: "/korban",
  },
  {
    slug: "water",
    title: "Wakaf Water Pump",
    description: "Support a clean-water project with location details, reviewed photos, and video after completion.",
    href: "/wakaf/water-pump",
  },
  {
    slug: "quran",
    title: "Wakaf Quran",
    description: "Arrange Quran distribution through one request and receive a completion record after fulfilment.",
    href: "/wakaf/quran",
  },
  {
    slug: "orphans",
    title: "Food for Orphans",
    description: "Help provide meals for orphans with delivery evidence and a completion record.",
    href: "/wakaf/food-for-orphans",
  },
] as const;

function PlatformSymbol({ type }: { type: (typeof platformServices)[number]["slug"] }) {
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

function Arrow() {
  return <svg viewBox="0 0 32 24" aria-hidden="true"><path d="M2 12h26M20 4l8 8-8 8" /></svg>;
}

export default function AboutPage() {
  return (
    <div className={styles.aboutPage}>
      <div className={styles.opening}>
        <Link className={styles.announcement} href="/services">
          <span>See how every service is followed through.</span>
          <span aria-hidden="true">&#8599;</span>
        </Link>
        <section className={styles.hero} aria-labelledby="about-hero-title">
          <div className={styles.heroAmbient} aria-hidden="true">
            <span className={styles.heroCircleOne} />
            <span className={styles.heroCircleTwo} />
            <span className={styles.heroCircleThree} />
            <span className={styles.heroCircleFour} />
            <span className={styles.heroCircleFive} />
            <span className={styles.heroCircleSix} />
            <span className={styles.heroCircleSeven} />
          </div>
          <div className={styles.heroCopy}>
            <h1 id="about-hero-title">Good intentions deserve careful follow-through.</h1>
            <p className={styles.heroSupport}>We bring Islamic services into one clear journey—from your request to reviewed evidence and a completion record.</p>
          </div>
        </section>

        <section className={styles.mission} aria-labelledby="about-mission-title">
          <div className={styles.missionAmbient} aria-hidden="true">
            <span className={styles.missionCircleOne} />
            <span className={styles.missionCircleTwo} />
            <span className={styles.missionCircleThree} />
          </div>
          <div className={styles.missionPanel}>
            <h2 id="about-mission-title">Our mission is to make Islamic services clear from intention to completion.</h2>
            <p className={styles.missionLead}>Amanah should be visible at every handoff.</p>
            <div className={styles.missionNarrative}>
              <p>Every request begins with the details the service actually needs—who it is for, where it should be fulfilled, and any instructions that must travel with it.</p>
              <p>Once a request is confirmed, an approved partner fulfils the work against that agreed brief. The handoff stays connected to the same journey instead of disappearing into a separate conversation.</p>
              <p>Photos, video, location details, or other evidence required for the service are submitted against the same request.</p>
              <p>That evidence is reviewed before the project is marked complete. The customer then receives a completion record that is retained with the request.</p>
            </div>
          </div>
          <div className={styles.missionCurve} aria-hidden="true" />
        </section>
      </div>

      <section className={styles.operatingStory} aria-labelledby="operating-story-title">
        <div className={styles.operatingInner}>
          <p className={styles.storyLabel}>Why we built this.</p>
          <div className={styles.storyGrid}>
            <div className={styles.storyThesis}>
              <h2 id="operating-story-title">Islamic services deserve a clear chain of responsibility, from intention through to completion.</h2>
              <div className={styles.projectImages}>
                <figure className={styles.projectImage}>
                  <Image src="/landing-water-point.png" width={132} height={132} sizes="132px" alt="Women collecting water at a community pump" />
                </figure>
                <figure className={styles.projectImage}>
                  <Image src="/services-korban-care.png" width={132} height={132} sizes="132px" alt="A Korban animal being cared for before fulfilment" />
                </figure>
              </div>
            </div>
            <div className={styles.storyNarrative}>
              <p>Arranging Korban or Wakaf involves more than a payment. The details of each request must first be confirmed.</p>
              <p>Those confirmed details are passed to an approved partner working from a clear brief.</p>
              <p>As the service is fulfilled, the work and submitted evidence are reviewed before completion.</p>
              <p>Confirmed service details, reviewed evidence, each handoff, and the completion record remain connected on the customer project.</p>
              <p className={styles.storyAttribution}>— The As-Sabiquun operating model.</p>
              <Link className={styles.storyAction} href="/#how">See how it works <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.platform} aria-labelledby="platform-title">
        <div className={styles.platformInner}>
          <div className={styles.platformHeading}>
            <p className={styles.platformLabel}>What we do.</p>
            <h2 id="platform-title">The As-Sabiquun service platform.</h2>
            <p>Four services, one clear path from request to reviewed completion.</p>
          </div>
          <div className={styles.platformGrid}>
            {platformServices.map((service) => (
              <Link className={`${styles.platformTile} ${styles[`platformTile${service.slug}`]}`} href={service.href} key={service.slug}>
                <span className={styles.platformSymbol}><PlatformSymbol type={service.slug} /></span>
                <span className={styles.platformCopy}>
                  <strong>{service.title}</strong>
                  <span>{service.description}</span>
                </span>
                <span className={styles.platformArrow}><Arrow /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.principles} aria-labelledby="principles-title">
        <div className={styles.principlesInner}>
          <div className={styles.principlesHeading}>
            <h2 id="principles-title">Amanah in practice.</h2>
          </div>
          <ol className={styles.principlesList}>
            {principles.map(([title, copy], index) => (
              <li className={styles.principleRow} key={title}>
                <span className={styles.principleNumber}>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <span className={styles.principleMark} aria-hidden="true"><Arrow /></span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="about-closing-title">
        <div className={styles.closingInner}>
          <h2 id="about-closing-title">Begin with a service you can follow.</h2>
          <p>Follow your service through reviewed evidence to a retained completion record.</p>
          <Link className={styles.closingAction} href="/services">Explore services</Link>
        </div>
      </section>
    </div>
  );
}
