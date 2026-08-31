import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About",
  description: "Learn how As-Sabiquun carries Islamic services from intention to completion through approved partners, reviewed evidence, and retained project records.",
};

const standards = [
  ["One connected project record.", "Confirmed service details, fulfilment handoffs, submitted evidence, and the completion record stay attached to the same customer project."],
  ["The right information for each role.", "Customers can follow their project, approved partners receive the confirmed brief, and administrators can review the work and submitted evidence."],
  ["Completion only after review.", "A project is marked complete only after the evidence required for that service has been submitted and reviewed."],
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
          <div className={styles.heroCopy}>
            <h1 id="about-hero-title">A sincere intention should never become an invisible handoff.</h1>
            <p className={styles.heroSupport}>When you entrust an Islamic service to someone, you should be able to see how that trust is carried.</p>
          </div>
          <ol className={styles.heroJourney} aria-label="The service journey">
            <li><span>01</span><strong>Intention</strong></li>
            <li><span>02</span><strong>Handoff</strong></li>
            <li><span>03</span><strong>Evidence</strong></li>
            <li><span>04</span><strong>Completion</strong></li>
          </ol>
        </section>

        <section className={styles.mission} aria-labelledby="about-mission-title">
          <div className={styles.missionPanel}>
            <h2 id="about-mission-title">The trust should not disappear after the request.</h2>
            <p className={styles.missionLead}>Details move between people and fulfilment happens elsewhere. As-Sabiquun keeps one accountable thread through the work.</p>
            <ol className={styles.missionNarrative}>
              <li>
                <span className={styles.missionStep}>Intention</span>
                <p>Your service details and instructions begin one project record.</p>
              </li>
              <li>
                <span className={styles.missionStep}>Handoff</span>
                <p>An approved partner receives the confirmed brief, with responsibility still attached.</p>
              </li>
              <li>
                <span className={styles.missionStep}>Evidence</span>
                <p>Required photos, video, or location details return to the same request for review.</p>
              </li>
              <li>
                <span className={styles.missionStep}>Completion</span>
                <p>Only then is the work marked complete and retained on the customer project.</p>
              </li>
            </ol>
          </div>
          <div className={styles.missionCurve} aria-hidden="true" />
        </section>
      </div>

      <section className={styles.operatingStory} aria-labelledby="operating-story-title">
        <div className={styles.operatingInner}>
          <div className={styles.storyGrid}>
            <div className={styles.storyThesis}>
              <h2 id="operating-story-title">Responsibility should travel with the service—not fall between organisations.</h2>
              <figure className={styles.storyFigure}>
                <div className={styles.storyFigureImage}>
                  <Image
                    src="/landing-water-point.png"
                    alt="Illustrative view of a community water point"
                    fill
                    sizes="(max-width: 860px) calc(100vw - 40px), 552px"
                  />
                </div>
                <figcaption>
                  <span>Wakaf water</span>
                  <span>Illustrative view of a community water point.</span>
                </figcaption>
              </figure>
            </div>
            <div className={styles.storyNarrative}>
              <p>As-Sabiquun exists to keep responsibility attached after someone chooses and funds an Islamic service.</p>
              <p>Approved fulfilment partners carry out the work locally. As-Sabiquun keeps the confirmed brief with that handoff and reviews the evidence returned against it.</p>
              <p>The customer receives more than an unsupported promise: confirmed service details, reviewed evidence, and completion status remain together on their project record.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.platform} aria-labelledby="platform-title">
        <div className={styles.platformInner}>
          <div className={styles.platformHeading}>
            <h2 id="platform-title">Four ways to begin.</h2>
            <p>Each service continues into the same clear, reviewed project journey.</p>
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
            <h2 id="principles-title">What customers can expect.</h2>
          </div>
          <ul className={styles.principlesList}>
            {standards.map(([title, copy]) => (
              <li className={styles.principleRow} key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
                <span className={styles.principleMotif} aria-hidden="true"><i /></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="about-closing-title">
        <div className={styles.closingInner}>
          <h2 id="about-closing-title">Choose a service. Keep sight of what follows.</h2>
          <p>Your service details, reviewed evidence, and completion status stay connected from the first request.</p>
          <Link className={styles.closingAction} href="/services">Choose a service</Link>
        </div>
      </section>
    </div>
  );
}
