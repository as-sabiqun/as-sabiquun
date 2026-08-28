import Link from "next/link";
import type { ReactNode } from "react";
import "./landing.css";

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

type PlatformService = {
  title: "Korban" | "Wakaf Water" | "Wakaf Quran" | "Food for Orphans" | "Giving Updates" | "Project Support";
  copy: string;
  href: string;
  tone: "coral" | "water" | "quran" | "food" | "updates" | "support";
  art: "korban" | "water" | "quran" | "food" | "updates" | "support";
};

type PlatformServiceList = readonly [
  PlatformService,
  PlatformService,
  PlatformService,
  PlatformService,
  PlatformService,
  PlatformService,
];

const platformServices = [
  { title: "Korban", copy: "Arrange a meaningful Korban with a clear path from intention to report.", href: "/korban", tone: "coral", art: "korban" },
  { title: "Wakaf Water", copy: "Help a water point reach the people who depend on it every day.", href: "/wakaf/water-pump", tone: "water", art: "water" },
  { title: "Wakaf Quran", copy: "Place Quran copies where learning and worship can continue.", href: "/wakaf/quran", tone: "quran", art: "quran" },
  { title: "Food for Orphans", copy: "Turn a simple meal into a moment of care shared together.", href: "/wakaf/food-for-orphans", tone: "food", art: "food" },
  { title: "Giving Updates", copy: "Follow each act of giving through reviewed field evidence and progress notes.", href: "#amanah", tone: "updates", art: "updates" },
  { title: "Project Support", copy: "Bring a larger intention to life with a team that can help shape the details.", href: "/contact", tone: "support", art: "support" },
] satisfies PlatformServiceList;

function PlatformArt({ type }: { type: PlatformService["art"] }) {
  if (type === "water") {
    return <div className="asb-platform-art asb-platform-art-water" aria-hidden="true"><img src="/landing-water-point.png" alt="" /><span>FIELD / WATER</span><i /></div>;
  }
  if (type === "quran") {
    return <div className="asb-platform-art asb-platform-art-quran" aria-hidden="true"><img src="/landing-quran-table.png" alt="" /><span><b>01</b> CONTINUES</span></div>;
  }
  if (type === "food") {
    return <div className="asb-platform-art asb-platform-art-food" aria-hidden="true"><img src="/landing-hero-volunteers.png" alt="" /><span>CARE, SHARED</span><i><b /><b /><b /></i></div>;
  }
  if (type === "updates") {
    return <div className="asb-platform-art asb-platform-art-updates" aria-hidden="true"><div className="asb-update-panel"><span>ASB / 0248</span><strong>Evidence received</strong><p><i /><i /><i /></p><small><b>✓</b> reviewed for you</small></div><img src="/brand/as-sabiquun-seal.png" alt="" /></div>;
  }
  if (type === "support") {
    return <div className="asb-platform-art asb-platform-art-support" aria-hidden="true"><span className="asb-support-node asb-support-node-one" /><span className="asb-support-node asb-support-node-two" /><span className="asb-support-node asb-support-node-three" /><svg viewBox="0 0 280 134"><path d="M29 102C70 102 67 35 120 35s52 67 100 67" /><path d="M120 35h80" /></svg><div>IDEA<br /><b>→</b> FIELD</div></div>;
  }
  return <div className="asb-platform-art asb-platform-art-korban" aria-hidden="true"><div className="asb-korban-tag"><span>INTENTION</span><b>KORBAN<br />2026</b><i /></div><div className="asb-korban-orb"><span /><span /><span /></div></div>;
}

function RecordMark() {
  return (
    <div className="asb-record-art" aria-hidden="true">
      <div className="asb-record-orbit asb-record-orbit-coral" />
      <div className="asb-record-orbit asb-record-orbit-violet" />
      <div className="asb-record-folder">
        <div className="asb-record-folder-top"><span>As-Sabiquun</span><i /></div>
        <strong>Project report</strong>
        <small>Wakaf Water Pump</small>
        <div className="asb-record-lines"><i /><i /><i /></div>
        <div className="asb-record-status"><b>✓</b><span>Evidence reviewed</span></div>
      </div>
      <div className="asb-record-seal"><img src="/brand/as-sabiquun-seal.png" alt="" /></div>
    </div>
  );
}

function ProofFragment({
  className,
  src,
  alt,
  children,
}: {
  className: string;
  src?: string;
  alt?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`asb-proof-fragment ${className}`}>
      {src ? <img src={src} alt={alt ?? ""} /> : null}
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="asb-landing">
      <header className="asb-nav-wrap">
        <div className="asb-nav">
          <Link href="/landing" className="asb-brand" aria-label="As-Sabiquun home">
            <img src="/brand/as-sabiquun-seal.png" alt="" />
            <span>As-Sabiquun</span>
          </Link>
          <nav aria-label="Landing page navigation">
            <a href="#services">Services</a>
            <a href="#amanah">Our amanah</a>
            <a href="#how">How it works</a>
          </nav>
          <Link href="/services" className="asb-nav-cta">Choose a service</Link>
        </div>
      </header>

      <main>
        <section className="asb-hero" aria-labelledby="hero-title">
          <div className="asb-hero-halo" aria-hidden="true" />
          <div className="asb-hero-media" aria-label="A collage of original As-Sabiquun fieldwork imagery">
            <ProofFragment className="asb-media-volunteers" src="/landing-hero-volunteers.png" alt="Volunteers preparing supplies together" />
            <ProofFragment className="asb-media-quran" src="/landing-quran-table.png" alt="Qurans arranged on a table" />
            <ProofFragment className="asb-media-water" src="/landing-water-point.png" alt="A completed community water point" />
            <ProofFragment className="asb-media-receipt">
              <span>FIELD NOTE</span><b>01</b><i>Project card</i>
            </ProofFragment>
            <ProofFragment className="asb-media-coordinate">
              <span>01°18&apos;N</span><i>service map</i>
            </ProofFragment>
            <ProofFragment className="asb-media-evidence">
              <span>REVIEWED</span><b>03</b><div><i /><i /><i /></div><em>evidence clips</em>
            </ProofFragment>
            <ProofFragment className="asb-media-route">
              <span>REPORT ROUTE</span><b>48h</b><i>from field to you</i>
            </ProofFragment>
            <ProofFragment className="asb-media-stamp">
              <span>ON SITE</span><b>✓</b><i>location logged</i>
            </ProofFragment>
            <ProofFragment className="asb-media-seal">
              <img src="/brand/as-sabiquun-seal.png" alt="" />
            </ProofFragment>
            <ProofFragment className="asb-media-dot" />
          </div>
          <div className="asb-hero-copy">
            <p className="asb-arabic" lang="ar" dir="rtl">السَّابِقُونَ إِلَى الْخَيْرِ</p>
            <h1 id="hero-title">Give with care.<br />Let good travel.</h1>
            <p>Islamic services, organised with care for the people and places at the heart of every act of giving.</p>
            <div className="asb-hero-actions">
              <Link href="#services" className="asb-button asb-button-primary">Explore services <Arrow /></Link>
              <Link href="#how" className="asb-button asb-button-secondary">See how it works</Link>
            </div>
          </div>
        </section>

        <section className="asb-trust-rail" aria-label="Fictional example organization marks">
          <p className="asb-trust-note">Fictional examples · not partners, endorsements, or accreditations</p>
          <h2>Care moves through people.</h2>
          <div className="asb-trust-marks" aria-label="Original fictional organization marks">
            <span className="asb-mark asb-mark-arch"><i />Amanah<br /><b>FIELDWORKS</b></span>
            <span className="asb-mark asb-mark-sun"><i />NUR<br /><b>COLLECTIVE</b></span>
            <span className="asb-mark asb-mark-crescent"><i />TITIPAN<br /><b>NETWORK</b></span>
            <span className="asb-mark asb-mark-line"><i />SADAQA<br /><b>STUDIO</b></span>
            <span className="asb-mark asb-mark-grid"><i />TANDA<br /><b>COMMONS</b></span>
            <span className="asb-mark asb-mark-star"><i />BINA<br /><b>WORKSHOP</b></span>
          </div>
        </section>

        <section className="asb-services" id="services" aria-labelledby="services-title">
          <div className="asb-section-lead">
            <p className="asb-label">Services</p>
            <h2 id="services-title">A place for every good intention.</h2>
            <p>Choose a way to give, follow its progress, or bring a bigger project into focus with our team.</p>
          </div>
          <ul className="asb-platform-grid" aria-label="Six service options">
            {platformServices.map((service, index) => (
              <li key={service.title}>
                <Link href={service.href} className={`asb-platform-card asb-platform-${service.tone}`}>
                  <span className="asb-platform-arrow"><Arrow /></span>
                  <div className="asb-platform-copy">
                    <p>0{index + 1}</p>
                    <h3>{service.title}</h3>
                    <span>{service.copy}</span>
                  </div>
                  <PlatformArt type={service.art} />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="asb-values" id="amanah" aria-labelledby="values-title">
          <div className="asb-values-well" aria-hidden="true">
            <img src="/brand/as-sabiquun-seal.png" alt="" />
          </div>
          <div className="asb-values-content">
            <div className="asb-values-lead">
              <p className="asb-values-label">Our values</p>
              <h2 id="values-title">A good intention deserves care in every direction.</h2>
              <p>These are the principles we return to as we make room for every person, question, and act of giving.</p>
            </div>
            <ol className="asb-values-list">
              <li className="asb-values-perimeter" aria-hidden="true">
                <svg viewBox="0 0 1000 1000" preserveAspectRatio="none">
                  <path className="asb-values-perimeter-base" d="M500 24C760 24 956 98 956 220V780C956 902 760 976 500 976S44 902 44 780V220C44 98 240 24 500 24Z" />
                  <path className="asb-values-perimeter-accent asb-values-perimeter-accent-care" d="M44 220V342M956 220V342" />
                  <path className="asb-values-perimeter-accent asb-values-perimeter-accent-dignity" d="M44 430V570M956 430V570" />
                  <path className="asb-values-perimeter-accent asb-values-perimeter-accent-honesty" d="M44 658V780M956 658V780" />
                </svg>
              </li>
              <li className="asb-values-entry asb-values-entry-care">
                <div className="asb-values-connector" aria-hidden="true"><span /></div>
                <div className="asb-values-card asb-values-card-care">
                  <span>01</span>
                  <p>Care for the people behind every intention.</p>
                </div>
              </li>
              <li className="asb-values-entry asb-values-entry-dignity">
                <div className="asb-values-connector" aria-hidden="true"><span /></div>
                <div className="asb-values-card asb-values-card-dignity">
                  <span>02</span>
                  <p>Dignity in every exchange.</p>
                </div>
              </li>
              <li className="asb-values-entry asb-values-entry-honesty">
                <div className="asb-values-connector" aria-hidden="true"><span /></div>
                <div className="asb-values-card asb-values-card-honesty">
                  <span>03</span>
                  <p>Honest communication, even while things are still unfolding.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="asb-how" id="how" aria-labelledby="how-title">
          <div className="asb-section-lead asb-section-lead-centred asb-stories-lead">
            <p className="asb-label">A closer look</p>
            <h2 id="how-title">Care is a practice, not a promise.</h2>
            <p>These concept scenes show the kinds of moments a thoughtful service can hold.</p>
          </div>

          <div className="asb-concept-film" aria-label="Concept video placeholder">
            <img src="/landing-hero-volunteers.png" alt="" />
            <div className="asb-concept-film-wash" aria-hidden="true" />
            <span className="asb-concept-film-label">Concept video placeholder</span>
            <span className="asb-concept-film-play" aria-hidden="true">→</span>
            <p>How care moves from an intention to a shared act.</p>
            <small>Original concept imagery · no footage has been supplied</small>
          </div>

          <div className="asb-stories" aria-label="Concept story collection">
            <div className="asb-stories-viewport">
              <div className="asb-story-rail">
                <Link className="asb-story-card asb-story-card-water" href="/wakaf/water-pump">
                  <img src="/landing-water-point.png" alt="" />
                  <div className="asb-story-card-shade" aria-hidden="true" />
                  <span className="asb-story-type">Giving guide</span>
                  <h3>Start where daily life happens.</h3>
                  <span className="asb-story-arrow"><Arrow /></span>
                </Link>
                <Link className="asb-story-card asb-story-card-quran" href="/wakaf/quran">
                  <img src="/landing-quran-table.png" alt="" />
                  <div className="asb-story-card-shade" aria-hidden="true" />
                  <span className="asb-story-type">Field notes</span>
                  <h3>Make room for learning to continue.</h3>
                  <span className="asb-story-arrow"><Arrow /></span>
                </Link>
                <Link className="asb-story-card asb-story-card-food" href="/wakaf/food-for-orphans">
                  <img src="/landing-hero-volunteers.png" alt="" />
                  <div className="asb-story-card-shade" aria-hidden="true" />
                  <span className="asb-story-type">Shared care</span>
                  <h3>A simple act can gather people together.</h3>
                  <span className="asb-story-arrow"><Arrow /></span>
                </Link>
              </div>
            </div>
            <div className="asb-story-controls" aria-hidden="true">
              <span className="is-active" /><span /><span />
              <i />
              <b>←</b><b>→</b>
            </div>
          </div>
        </section>

        <section className="asb-closing" aria-labelledby="closing-title">
          <div className="asb-closing-circles" aria-hidden="true"><i /><i /><i /></div>
          <div className="asb-closing-inner">
            <p className="asb-label">Begin with intention</p>
            <h2 id="closing-title">Let your next act of good begin here.</h2>
            <p>Choose the service that feels right for the intention you are carrying today.</p>
            <Link href="/services" className="asb-button asb-button-dark">Explore services <Arrow /></Link>
          </div>
        </section>
      </main>

      <footer className="asb-footer">
        <div className="asb-footer-brand-panel">
          <img src="/brand/as-sabiquun-seal.png" alt="" />
          <p className="asb-footer-kicker">As-Sabiquun</p>
          <strong>Make room<br />for good.</strong>
          <p>Islamic services shaped around care, clarity, and meaningful intention.</p>
        </div>
        <div className="asb-footer-links-panel">
          <div>
            <p>Explore</p>
            <Link href="/services">Services</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div>
            <p>Account</p>
            <Link href="/login">Sign in</Link>
            <Link href="/signup">Create account</Link>
            <Link href="/partner-login">Partner login</Link>
          </div>
          <small>© {new Date().getFullYear()} As-Sabiquun Association Consultancy</small>
        </div>
      </footer>
    </div>
  );
}
