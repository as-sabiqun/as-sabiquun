import Link from "next/link";
import Image from "next/image";
import { ScrollGeometry } from "./scroll-geometry";
import { StoryCarousel } from "./story-carousel";
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
        <div className="asb-nav">
          <Link href="/" className="asb-brand" aria-label="As-Sabiquun home">
            <Image src="/brand/as-sabiquun-seal.png" width={2000} height={2000} sizes="34px" alt="" />
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
            <Link href="/services" className="asb-nav-cta"><span>Choose</span>{" "}<span>a</span>{" "}<span>service</span></Link>
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
                  <Image src="/landing-hero-volunteers.png" width={2048} height={2048} sizes="468px" alt="" />
                  <i /><i />
                </div>
              </div>
              <div className="asb-hero-orbit-item asb-orbit-two">
                <div className="asb-orbit-visual asb-orbit-photo asb-orbit-photo-quran">
                  <Image src="/landing-quran-table.png" width={2752} height={1536} sizes="468px" alt="" />
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
                  <Image src="/landing-portrait-community.png" width={1254} height={1254} sizes="468px" loading="eager" alt="" />
                </div>
              </div>
              <div className="asb-hero-orbit-item asb-orbit-five">
                <div className="asb-orbit-visual asb-orbit-seal">
                  <span className="asb-orbit-seal-ring" />
                  <Image src="/brand/as-sabiquun-seal.png" width={2000} height={2000} sizes="86px" alt="" />
                  <strong>Care,<br />carried<br />forward.</strong>
                </div>
              </div>
              <div className="asb-hero-orbit-item asb-orbit-six">
                <div className="asb-orbit-visual asb-orbit-photo asb-orbit-photo-water">
                  <Image src="/landing-water-point.png" width={2752} height={1536} sizes="468px" alt="" />
                </div>
              </div>
              <div className="asb-hero-orbit-item asb-orbit-seven">
                <div className="asb-orbit-visual asb-orbit-photo asb-orbit-photo-coordinator">
                  <Image src="/landing-portrait-coordinator.png" width={1254} height={1254} sizes="468px" loading="eager" alt="" />
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
            <p className="asb-label">the platform</p>
            <h2 id="services-title">What we provide</h2>
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
            <Image src="/brand/as-sabiquun-seal.png" width={2000} height={2000} sizes="118px" alt="" />
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
                  <p className="asb-values-explanation">We hold every request with care for the giver, the people receiving support, and the communities around them, making space for context, questions, and human needs at each step.</p>
                </div>
              </li>
              <li className="asb-values-entry asb-values-entry-dignity">
                <div className="asb-values-connector" aria-hidden="true"><span /></div>
                <div className="asb-values-card asb-values-card-dignity">
                  <span className="asb-values-index">02</span>
                  <p className="asb-values-principle">Dignity in every exchange.</p>
                  <p className="asb-values-explanation">We communicate with patience and respect, protect the meaning behind each request, and design every exchange so families, partners, and communities feel heard, informed, and treated with dignity.</p>
                </div>
              </li>
              <li className="asb-values-entry asb-values-entry-honesty">
                <div className="asb-values-connector" aria-hidden="true"><span /></div>
                <div className="asb-values-card asb-values-card-honesty">
                  <span className="asb-values-index">03</span>
                  <p className="asb-values-principle">Honest updates as work unfolds.</p>
                  <p className="asb-values-explanation">We share clear progress notes and reviewed field evidence as work develops, explaining what is known, what is still moving, and what comes next without pretending every answer is immediate.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="asb-how" id="how" aria-labelledby="how-title">
          <div className="asb-section-lead asb-section-lead-centred asb-stories-lead">
            <h2 id="how-title">Care is a practice, not a promise.<br />Every detail should show it.</h2>
            <p className="asb-case-support"><span className="asb-case-support-label">Case Studies</span><span>These concept scenes show the kinds of moments a thoughtful service can hold.</span></p>
          </div>

          <div className="asb-concept-film" aria-label="Concept video placeholder">
            <div className="asb-concept-film-stage">
              <Image src="/landing-portrait-community.png" width={1254} height={1254} sizes="960px" alt="" />
              <div className="asb-concept-film-wash" aria-hidden="true" />
              <span className="asb-concept-film-label">Concept video placeholder</span>
              <span className="asb-concept-film-play" aria-hidden="true">▶</span>
              <p>How care moves from an intention to a shared act.</p>
            </div>
            <div className="asb-concept-film-quote">
              <p>“Clarity keeps a good intention connected to the people it was meant to serve, from the first conversation to the final field update.”</p>
              <div className="asb-concept-author">
                <Image src="/landing-hero-volunteers.png" width={2048} height={2048} sizes="56px" alt="" />
                <span><strong>Concept field profile</strong><small>Fictional profile · original concept imagery</small></span>
              </div>
              <div className="asb-concept-operator" aria-label="Fictional Amanah Fieldworks concept mark">
                <i aria-hidden="true" /><span>Amanah<br /><b>FIELDWORKS</b></span>
              </div>
            </div>
          </div>

          <StoryCarousel />
        </section>

        <section className="asb-simple-closing" aria-labelledby="simple-closing-title">
          <div className="asb-simple-closing-inner">
            <p className="asb-simple-closing-label">A clear next step</p>
            <div className="asb-simple-closing-copy">
              <h2 id="simple-closing-title">Begin with the service that fits your intention.</h2>
              <p>Explore the available services, or speak with us if you are not yet sure where to start.</p>
              <div className="asb-simple-closing-actions">
                <Link href="/services" className="asb-simple-action asb-simple-action-primary">Explore services <Arrow /></Link>
                <Link href="/contact" className="asb-simple-action asb-simple-action-secondary">Ask a question <Arrow /></Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="asb-simple-footer">
          <div className="asb-simple-footer-inner">
            <div className="asb-simple-footer-brand">
              <Link href="/" aria-label="As-Sabiquun home">
                <Image src="/brand/as-sabiquun-seal.png" width={2000} height={2000} sizes="48px" alt="" />
                <span>As-Sabiquun</span>
              </Link>
              <p>Islamic services organised with care, clarity, and accountability.</p>
            </div>
            <nav className="asb-simple-footer-group" aria-label="Ways to give">
              <p>Ways to give</p>
              <Link href="/korban">Korban</Link>
              <Link href="/wakaf/water-pump">Wakaf water</Link>
              <Link href="/wakaf/quran">Wakaf Quran</Link>
              <Link href="/wakaf/food-for-orphans">Food for orphans</Link>
            </nav>
            <nav className="asb-simple-footer-group" aria-label="Explore">
              <p>Explore</p>
              <Link href="/services">Services</Link>
              <Link href="/about">About</Link>
              <Link href="/#how">Field stories</Link>
              <Link href="/contact">Contact</Link>
            </nav>
            <nav className="asb-simple-footer-group" aria-label="Account">
              <p>Account</p>
              <Link href="/login">Sign in</Link>
              <Link href="/signup">Create account</Link>
              <Link href="/partner-login">Partner login</Link>
            </nav>
          </div>
          <div className="asb-simple-footer-bottom">
            <small>© {new Date().getFullYear()} As-Sabiquun Association Consultancy</small>
            <nav aria-label="Social links">
              <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
            </nav>
          </div>
        </footer>
      </main>
    </div>
  );
}
