import Link from "next/link";
import "./landing.css";
import { catalogServicesFrom, services } from "@/components/service-card";
import { getActiveOfferings } from "@/lib/offerings";

const serviceTones = ["coral", "violet", "green", "sun"] as const;

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

function ServiceGlyph({ type }: { type: "korban" | "water" | "quran" | "orphans" }) {
  if (type === "water") {
    return <svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 10C30 25 21 35 21 49a19 19 0 0 0 38 0C59 35 50 25 40 10Z" /><path d="M30 51c2 6 7 9 13 9" /></svg>;
  }
  if (type === "quran") {
    return <svg viewBox="0 0 80 80" aria-hidden="true"><path d="M12 20c11-4 21-1 28 6v39c-7-7-17-10-28-6V20Z" /><path d="M68 20c-11-4-21-1-28 6v39c7-7 17-10 28-6V20Z" /><path d="M19 33c6-2 12 0 17 4M61 33c-6-2-12 0-17 4" /></svg>;
  }
  if (type === "orphans") {
    return <svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 64S14 49 14 29c0-9 6-15 14-15 6 0 10 3 12 8 2-5 6-8 12-8 8 0 14 6 14 15 0 20-26 35-26 35Z" /><path d="M27 46c8-5 18-5 26 0" /></svg>;
  }
  return <svg viewBox="0 0 80 80" aria-hidden="true"><path d="M18 53c2-14 10-25 22-25s20 11 22 25" /><path d="M25 29c-5-2-8-6-9-11 8 0 13 3 17 9M55 29c5-2 8-6 9-11-8 0-13 3-17 9M29 53v9M51 53v9M32 40h.1M48 40h.1" /></svg>;
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

export default async function LandingPage() {
  const activeServices = catalogServicesFrom(await getActiveOfferings());
  const visibleServices = activeServices.length ? activeServices : services;

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
        <section className="asb-hero">
          <div className="asb-hero-copy">
            <p className="asb-arabic" lang="ar" dir="rtl">السَّابِقُونَ إِلَى الْخَيْرِ</p>
            <h1>Give with care.<br />See the good unfold.</h1>
            <p>Choose an Islamic service. Our team coordinates the work, reviews the evidence, and sends your completed report.</p>
            <div className="asb-hero-actions">
              <Link href="#services" className="asb-button asb-button-primary">Explore services <Arrow /></Link>
              <Link href="#how" className="asb-button asb-button-secondary">How it works</Link>
            </div>
          </div>
          <RecordMark />
        </section>

        <section className="asb-intro-strip" aria-label="Our promise">
          <p>Islamic services with a clear record of what was done.</p>
          <div><span>Receipt</span><span>Location</span><span>Photos &amp; video</span><span>Reviewed report</span></div>
        </section>

        <section className="asb-services" id="services" aria-labelledby="services-title">
          <div className="asb-section-lead">
            <p className="asb-label">Services</p>
            <h2 id="services-title">Give to what matters to you.</h2>
            <p>Choose the service that feels right. We make the next steps clear from the start.</p>
          </div>
          <div className="asb-service-grid">
            {visibleServices.map((service, index) => (
              <Link href={service.href} key={service.slug} className={`asb-service-card asb-tone-${serviceTones[index % serviceTones.length]}`}>
                <div className="asb-service-icon"><ServiceGlyph type={service.slug} /></div>
                <div>
                  <p>{service.number}</p>
                  <h3>{service.title}</h3>
                  <span>{service.description}</span>
                </div>
                <b>Explore <Arrow /></b>
              </Link>
            ))}
          </div>
        </section>

        <section className="asb-amanah" id="amanah" aria-labelledby="amanah-title">
          <div className="asb-amanah-window">
            <div className="asb-amanah-window-top"><span>Order ASB-0248</span><b>In review</b></div>
            <div className="asb-amanah-window-body">
              <p>Wakaf Quran</p>
              <strong>Your evidence is being checked.</strong>
              <div className="asb-proof-preview"><span>9</span><span>4</span><span>✓</span></div>
              <small>Photos&nbsp;&nbsp;&nbsp;&nbsp; Videos&nbsp;&nbsp;&nbsp;&nbsp; Location</small>
            </div>
            <div className="asb-amanah-window-foot"><i /><span>We review every report before it reaches you.</span></div>
          </div>
          <div className="asb-amanah-copy">
            <p className="asb-label">Our amanah</p>
            <h2 id="amanah-title">Your service does not disappear after you pay.</h2>
            <p>Every project follows a clear path. You can see its progress, and we only deliver the report after our team has reviewed the evidence.</p>
            <Link href="/about" className="asb-text-link">How As-Sabiquun works <Arrow /></Link>
          </div>
        </section>

        <section className="asb-how" id="how" aria-labelledby="how-title">
          <div className="asb-section-lead asb-section-lead-centred">
            <p className="asb-label">The process</p>
            <h2 id="how-title">Simple for you. Careful at every step.</h2>
          </div>
          <ol className="asb-steps">
            <li><span>01</span><h3>Choose a service</h3><p>Pick the service and share the details we need.</p></li>
            <li><span>02</span><h3>We arrange the work</h3><p>An approved partner carries out the work on the ground.</p></li>
            <li><span>03</span><h3>We check the evidence</h3><p>Our team reviews the location, photos, and videos.</p></li>
            <li><span>04</span><h3>Receive your report</h3><p>Get your completed report by email and Telegram.</p></li>
          </ol>
        </section>

        <section className="asb-closing" aria-labelledby="closing-title">
          <div className="asb-closing-orb"><img src="/brand/as-sabiquun-seal.png" alt="" /></div>
          <p className="asb-label">Begin with intention</p>
          <h2 id="closing-title">Choose a service that keeps giving.</h2>
          <p>Start with a service today. We will keep you informed until your report is ready.</p>
          <Link href="/services" className="asb-button asb-button-dark">Choose a service <Arrow /></Link>
        </section>
      </main>

      <footer className="asb-footer">
        <div className="asb-footer-brand"><img src="/brand/as-sabiquun-seal.png" alt="" /><strong>As-Sabiquun</strong></div>
        <p>Islamic services, carried out with care and shown with proof.</p>
        <div><Link href="/services">Services</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/login">Team login</Link></div>
        <small>© {new Date().getFullYear()} As-Sabiquun Association Consultancy</small>
      </footer>
    </div>
  );
}
