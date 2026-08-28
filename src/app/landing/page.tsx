import Link from "next/link";
import { ScrollGeometry } from "./scroll-geometry";
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
  const labels = {
    korban: ["Korban request", "Intention confirmed"],
    water: ["Water project", "Field location reviewed"],
    quran: ["Quran wakaf", "Distribution planned"],
    food: ["Shared meal", "Community list ready"],
    updates: ["Giving update", "Evidence received"],
    support: ["Project brief", "Next step prepared"],
  } as const;

  const body = type === "korban" ? (
    <div className="asb-ui-requests">
      <div className="asb-ui-toolbar"><span>All requests</span><i>Search by name or reference…</i><b>＋ New</b></div>
      <div className="asb-ui-table-head"><span>Household</span><span>Service</span><span>Status</span><span>Updated</span></div>
      {["Nur Hidayah", "Muhammad Irfan", "Siti Mariam", "Abdul Rahman"].map((name, index) => <div className="asb-ui-table-row" key={name}><i>{name.slice(0, 1)}</i><span>{name}<small>ASB-024{index + 4}</small></span><span>{index % 2 ? "Korban share" : "Family Korban"}</span><b>{index === 3 ? "Preparing" : "Confirmed"}</b><em>{index + 2}h ago</em></div>)}
    </div>
  ) : type === "water" ? (
    <div className="asb-ui-project">
      <div className="asb-ui-project-map"><span /><span /><span /><svg viewBox="0 0 320 150"><path d="M18 122C74 96 93 126 142 82s92-29 160-68" /></svg><b>FIELD SITE 03</b></div>
      <div className="asb-ui-project-stats"><span><small>Stage</small><b>Site review</b></span><span><small>Evidence</small><b>12 files</b></span><span><small>Next check</small><b>Friday</b></span></div>
    </div>
  ) : type === "quran" ? (
    <div className="asb-ui-calendar">
      <div className="asb-ui-calendar-head"><b>Distribution plan</b><span>June 2026⌄</span></div>
      <div className="asb-ui-calendar-grid">{["M","T","W","T","F","S","S"].map((day, index) => <span key={`${day}-${index}`}><b>{day}</b><i className={index === 3 ? "is-active" : ""}>{16 + index}</i><em /><em /></span>)}</div>
      <div className="asb-ui-calendar-note"><i>✓</i><span><b>Learning centre delivery</b><small>Coordinator and recipient list confirmed</small></span><em>240 copies</em></div>
    </div>
  ) : type === "food" ? (
    <div className="asb-ui-meals">
      <div className="asb-ui-meal-summary"><span><small>Meals planned</small><b>420</b><em>↑ 18%</em></span><span><small>Locations</small><b>06</b><em>All reviewed</em></span></div>
      <div className="asb-ui-bars"><i style={{ height: "42%" }} /><i style={{ height: "65%" }} /><i style={{ height: "54%" }} /><i style={{ height: "86%" }} /><i style={{ height: "70%" }} /><i style={{ height: "94%" }} /><i style={{ height: "78%" }} /></div>
      <div className="asb-ui-meal-legend"><span><i />Prepared</span><span><i />Reviewed</span><span>Mon — Sun</span></div>
    </div>
  ) : type === "updates" ? (
    <div className="asb-ui-feed">
      {["Evidence uploaded", "Field note reviewed", "Update prepared"].map((title, index) => <div key={title}><span className={`asb-ui-feed-thumb asb-ui-feed-thumb-${index + 1}`}><i /></span><p><b>{title}</b><small>{index === 0 ? "8 photos · water point" : index === 1 ? "Coordinator check complete" : "Ready for your dashboard"}</small></p><em>{index === 0 ? "09:42" : index === 1 ? "Yesterday" : "2d"}</em></div>)}
    </div>
  ) : (
    <div className="asb-ui-brief">
      <div className="asb-ui-brief-nav"><b>Project space</b><span className="is-active">Overview</span><span>People</span><span>Files</span><span>Notes</span></div>
      <div className="asb-ui-brief-main"><span className="asb-ui-brief-status">BRIEF / OPEN</span><h4>Bring the next project into focus.</h4><p><i /><i /><i /></p><div><span><b>01</b> Define the intention</span><span><b>02</b> Review the route</span><span><b>03</b> Begin together</span></div></div>
    </div>
  );

  return (
    <div className={`asb-platform-art asb-platform-art-${type}`} aria-hidden="true">
      <div className={`asb-service-ui asb-service-ui-${type}`}>
        <div className="asb-service-ui-bar"><i /><i /><i /><span>AS-SABIQUUN</span></div>
        <div className="asb-service-ui-head">
          <span>{labels[type][0]}</span><b>•••</b>
        </div>
        <div className="asb-service-ui-body">{body}</div>
      </div>
    </div>
  );
}

function FooterMark() {
  return <div className="asb-footer-mark" aria-label="As-Sabiquun"><i /><i /><i /><i /><i /><i /><i /><i /></div>;
}

function TrustMarkSet({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="asb-trust-mark-set" aria-hidden={hidden || undefined}>
      <span className="asb-mark asb-mark-arch"><i /><span>Amanah<b>FIELDWORKS</b></span></span>
      <span className="asb-mark asb-mark-sun"><i /><span>NUR<b>COLLECTIVE</b></span></span>
      <span className="asb-mark asb-mark-crescent"><i /><span>Titipan<b>NETWORK</b></span></span>
      <span className="asb-mark asb-mark-line"><i /><span>Sadaqa<b>STUDIO</b></span></span>
      <span className="asb-mark asb-mark-grid"><i /><span>TANDA<b>COMMONS</b></span></span>
      <span className="asb-mark asb-mark-star"><i /><span>Bina<b>WORKSHOP</b></span></span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="asb-landing">
      <ScrollGeometry />
      <header className="asb-nav-wrap">
        <div className="asb-nav" style={{ backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)" }}>
          <Link href="/landing" className="asb-brand" aria-label="As-Sabiquun home">
            <img src="/brand/as-sabiquun-seal.png" alt="" />
            <span>As-Sabiquun</span>
          </Link>
          <nav aria-label="Landing page navigation">
            <a href="#services">Services</a>
            <a href="#amanah">Our amanah</a>
            <a href="#how">How it works</a>
            <Link href="/dashboard">Giving updates</Link>
            <Link href="/about">About</Link>
          </nav>
          <div className="asb-nav-actions">
            <Link href="/contact" className="asb-nav-text-link">Contact</Link>
            <Link href="/services" className="asb-nav-cta">Choose a service</Link>
            <details className="asb-mobile-menu">
              <summary className="asb-nav-menu" aria-label="Open navigation menu"><i /><i /></summary>
              <div className="asb-mobile-menu-panel">
                <a href="#services">Services</a>
                <a href="#amanah">Our amanah</a>
                <a href="#how">How it works</a>
                <Link href="/dashboard">Giving updates</Link>
                <Link href="/about">About</Link>
                <Link href="/contact">Contact</Link>
                <Link href="/services" className="asb-mobile-menu-cta">Choose a service</Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      <Link href="/dashboard" className="asb-announcement">
        Explore latest field updates <Arrow />
      </Link>

      <main>
        <section className="asb-hero" aria-labelledby="hero-title">
          <div className="asb-hero-media" aria-label="Eight original As-Sabiquun fieldwork and service compositions">
            <div className="asb-hero-orbit" aria-hidden="true">
              <div className="asb-hero-orbit-item asb-orbit-one">
                <div className="asb-orbit-visual asb-orbit-abstract">
                  <img src="/landing-hero-volunteers.png" alt="" />
                  <i /><i />
                </div>
              </div>
              <div className="asb-hero-orbit-item asb-orbit-two">
                <div className="asb-orbit-visual asb-orbit-photo asb-orbit-photo-quran">
                  <img src="/landing-quran-table.png" alt="" />
                </div>
              </div>
              <div className="asb-hero-orbit-item asb-orbit-three">
                <div className="asb-orbit-visual asb-orbit-route">
                  <span className="asb-orbit-route-label">Project route</span>
                  <strong>48h</strong>
                  <span className="asb-orbit-route-line"><i /><i /><i /><i /></span>
                  <small>Field → review → update</small>
                </div>
              </div>
              <div className="asb-hero-orbit-item asb-orbit-four">
                <div className="asb-orbit-visual asb-orbit-photo asb-orbit-photo-community">
                  <img src="/landing-portrait-community.png" alt="" />
                </div>
              </div>
              <div className="asb-hero-orbit-item asb-orbit-five">
                <div className="asb-orbit-visual asb-orbit-seal">
                  <span className="asb-orbit-seal-ring" />
                  <img src="/brand/as-sabiquun-seal.png" alt="" />
                  <strong>Care,<br />carried<br />forward.</strong>
                </div>
              </div>
              <div className="asb-hero-orbit-item asb-orbit-six">
                <div className="asb-orbit-visual asb-orbit-photo asb-orbit-photo-water">
                  <img src="/landing-water-point.png" alt="" />
                </div>
              </div>
              <div className="asb-hero-orbit-item asb-orbit-seven">
                <div className="asb-orbit-visual asb-orbit-photo asb-orbit-photo-coordinator">
                  <img src="/landing-portrait-coordinator.png" alt="" />
                </div>
              </div>
              <div className="asb-hero-orbit-item asb-orbit-eight">
                <div className="asb-orbit-visual asb-orbit-update">
                  <div className="asb-orbit-update-card">
                    <span>ASB / 0248</span>
                    <strong>Evidence received</strong>
                    <p><i /><i /><i /></p>
                    <small><b>✓</b> Reviewed for you</small>
                  </div>
                  <span className="asb-orbit-update-date">03<br /><b>updates</b></span>
                </div>
              </div>
            </div>
          </div>
          <div className="asb-hero-copy">
            <h1 id="hero-title">Give with care.<br />Let good travel.</h1>
            <p>Islamic services, organised with care for the people and places at the heart of every act of giving.</p>
            <div className="asb-hero-actions">
              <Link href="#services" className="asb-button asb-button-primary">Explore services <Arrow /></Link>
            </div>
          </div>
          <svg className="asb-hero-wave" viewBox="0 0 1280 92" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 12C172 55 354 77 578 78C836 80 1050 49 1280 8V92H0Z" />
          </svg>
        </section>

        <section className="asb-trust-rail" aria-label="Fictional example organization marks">
          <h2>Trusted by communities built around care</h2>
          <div className="asb-trust-marquee" aria-label="Original fictional organization marks">
            <div className="asb-trust-marks">
              <TrustMarkSet />
              <TrustMarkSet hidden />
            </div>
          </div>
          <p className="asb-trust-note">Illustrative organization marks · not partners, endorsements, or accreditations</p>
        </section>

        <section className="asb-services" id="services" aria-labelledby="services-title">
          <div className="asb-section-lead">
            <p className="asb-label">Services</p>
            <h2 id="services-title">Ways to give with care.</h2>
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
                  <span className="asb-values-index">01</span>
                  <p className="asb-values-principle">Care for people.</p>
                  <p className="asb-values-explanation">Every intention is handled with attention to the people and communities behind it.</p>
                </div>
              </li>
              <li className="asb-values-entry asb-values-entry-dignity">
                <div className="asb-values-connector" aria-hidden="true"><span /></div>
                <div className="asb-values-card asb-values-card-dignity">
                  <span className="asb-values-index">02</span>
                  <p className="asb-values-principle">Dignity in every exchange.</p>
                  <p className="asb-values-explanation">We communicate thoughtfully, protect context, and treat every participant with respect.</p>
                </div>
              </li>
              <li className="asb-values-entry asb-values-entry-honesty">
                <div className="asb-values-connector" aria-hidden="true"><span /></div>
                <div className="asb-values-card asb-values-card-honesty">
                  <span className="asb-values-index">03</span>
                  <p className="asb-values-principle">Honest updates as work unfolds.</p>
                  <p className="asb-values-explanation">We share reviewed field evidence and clear progress notes, including while a project is still moving.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="asb-how" id="how" aria-labelledby="how-title">
          <div className="asb-section-lead asb-section-lead-centred asb-stories-lead">
            <p className="asb-label">A closer look</p>
            <h2 id="how-title">Care is a practice, not a promise.<br />Every detail should show it.</h2>
            <p>These concept scenes show the kinds of moments a thoughtful service can hold.</p>
          </div>

          <div className="asb-concept-film" aria-label="Concept video placeholder">
            <div className="asb-concept-film-stage">
              <img src="/landing-portrait-community.png" alt="" />
              <div className="asb-concept-film-wash" aria-hidden="true" />
              <span className="asb-concept-film-label">Concept video placeholder</span>
              <span className="asb-concept-film-play" aria-hidden="true">▶</span>
              <p>How care moves from an intention to a shared act.</p>
            </div>
            <div className="asb-concept-film-quote">
              <p>“Clarity keeps a good intention connected to the people it was meant to serve, from the first conversation to the final field update.”</p>
              <div className="asb-concept-author">
                <img src="/landing-hero-volunteers.png" alt="" />
                <span><strong>Concept field profile</strong><small>Fictional profile · original concept imagery</small></span>
              </div>
              <div className="asb-concept-operator" aria-label="Fictional Amanah Fieldworks concept mark">
                <i aria-hidden="true" /><span>Amanah<br /><b>FIELDWORKS</b></span>
              </div>
            </div>
          </div>

          <div className="asb-stories" aria-label="Concept story collection">
            <div className="asb-stories-viewport">
              <div className="asb-story-rail">
                <Link className="asb-story-card asb-story-card-water" href="/wakaf/water-pump">
                  <div className="asb-story-mark"><span>01</span><b>FIELD NOTE</b></div>
                  <span className="asb-story-type">Wakaf water</span>
                  <h3>Start where daily life happens.</h3>
                  <div className="asb-story-card-foot"><p>Why dependable access changes the rhythm of a community.</p><span className="asb-story-arrow"><Arrow /></span></div>
                </Link>
                <Link className="asb-story-card asb-story-card-quran" href="/wakaf/quran">
                  <div className="asb-story-mark"><span>02</span><b>CONTINUITY</b></div>
                  <span className="asb-story-type">Wakaf Quran</span>
                  <h3>Make room for learning to continue.</h3>
                  <div className="asb-story-card-foot"><p>A closer look at giving that keeps knowledge within reach.</p><span className="asb-story-arrow"><Arrow /></span></div>
                </Link>
                <Link className="asb-story-card asb-story-card-food" href="/wakaf/food-for-orphans">
                  <div className="asb-story-mark"><span>03</span><b>SHARED TABLE</b></div>
                  <span className="asb-story-type">Shared care</span>
                  <h3>A simple act can gather people together.</h3>
                  <div className="asb-story-card-foot"><p>What a meal can hold beyond the moment it is served.</p><span className="asb-story-arrow"><Arrow /></span></div>
                </Link>
                <Link className="asb-story-card asb-story-card-korban" href="/korban">
                  <div className="asb-story-mark"><span>04</span><b>INTENTION</b></div>
                  <span className="asb-story-type">Korban guide</span>
                  <h3>Carry an intention through with care.</h3>
                  <div className="asb-story-card-foot"><p>A practical path from choosing a service to receiving its report.</p><span className="asb-story-arrow"><Arrow /></span></div>
                </Link>
                <Link className="asb-story-card asb-story-card-updates" href="#amanah">
                  <div className="asb-story-mark"><span>05</span><b>REVIEWED</b></div>
                  <span className="asb-story-type">Giving updates</span>
                  <h3>Stay close to work happening far away.</h3>
                  <div className="asb-story-card-foot"><p>How field evidence becomes an update that is useful and clear.</p><span className="asb-story-arrow"><Arrow /></span></div>
                </Link>
              </div>
            </div>
            <div className="asb-story-controls">
              <button type="button" aria-label="Previous stories">←</button>
              <button type="button" aria-label="Next stories">→</button>
            </div>
          </div>
        </section>

        <div className="asb-final-stack">
          <section className="asb-closing" aria-labelledby="closing-title">
            <div className="asb-closing-circles" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            <div className="asb-closing-inner">
              <h2 id="closing-title">An Islamic giving platform built<br />with care for every intention<br />and clarity at every step.</h2>
              <Link href="/services" className="asb-button asb-button-dark">Explore services <Arrow /></Link>
            </div>
          </section>

          <footer className="asb-footer">
            <div className="asb-footer-brand-panel">
              <FooterMark />
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
          <div>
            <p>Learn</p>
            <Link href="/about">Our approach</Link>
            <Link href="/contact">Ask a question</Link>
            <Link href="/landing#how">Field stories</Link>
          </div>
          <div>
            <p>Ways to give</p>
            <Link href="/korban">Korban</Link>
            <Link href="/wakaf/water-pump">Wakaf water</Link>
            <Link href="/wakaf/quran">Wakaf Quran</Link>
            <Link href="/wakaf/food-for-orphans">Food for orphans</Link>
          </div>
          <div>
            <p>Transparency</p>
            <Link href="/landing#amanah">Our amanah</Link>
            <Link href="/landing#how">Giving updates</Link>
            <Link href="/contact">Project support</Link>
          </div>
          <div>
            <p>Help</p>
            <Link href="/contact">Contact</Link>
            <Link href="/about">FAQs</Link>
            <Link href="/about">Policies</Link>
          </div>
              <small>© {new Date().getFullYear()} As-Sabiquun Association Consultancy</small>
            </div>
            <div className="asb-footer-handoff" aria-label="As-Sabiquun footer summary">
              <small>© {new Date().getFullYear()} As-Sabiquun</small>
              <div className="asb-footer-principles" aria-label="Our operating principles">
                <span><i>✓</i><b>Amanah</b></span>
                <span><i>•</i><b>Field-led</b></span>
                <span><i>↗</i><b>Clear</b></span>
              </div>
              <span className="asb-footer-social" aria-label="Social links">in</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
