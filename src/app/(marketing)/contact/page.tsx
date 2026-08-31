import type { Metadata } from "next";
import Link from "next/link";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the As-Sabiquun team about Islamic services or get support for an existing project.",
};

function MessageMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7.5 8.5h17v11h-9l-5.5 4v-4H7.5v-11Z" />
      <path d="M12 13h8M12 16.5h5" />
    </svg>
  );
}

function ProjectMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M10 7.5h12v17H10z" />
      <path d="M13 12h6M13 16h6M13 20h3" />
      <path d="m20.5 23.5 4-4" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 18" aria-hidden="true">
      <path d="M2 9h18M14 3l6 6-6 6" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <div className={styles.contactPage}>
      <section className={styles.opening} aria-labelledby="contact-title">
        <div className={styles.openingInner}>
          <header className={styles.intro}>
            <h1 id="contact-title">Plan a service or get help with a project.</h1>
            <p>Choose the route that matches where you are now. We will keep the next step clear.</p>
          </header>

          <div className={styles.routes}>
            <article className={styles.routeCard}>
              <span className={styles.routeMark}><MessageMark /></span>
              <div className={styles.routeCopy}>
                <h2>Planning a service</h2>
                <p>Ask about an Islamic service, location, or what you need before placing an order.</p>
              </div>
              <a className={styles.routeAction} href="https://wa.me/6589933786" target="_blank" rel="noreferrer">
                Message on WhatsApp
                <Arrow />
              </a>
            </article>

            <article className={styles.routeCard}>
              <span className={styles.routeMark}><ProjectMark /></span>
              <div className={styles.routeCopy}>
                <h2>Support for a project</h2>
                <p>Keep a question or concern connected to the right project and order reference.</p>
              </div>
              <Link className={styles.routeAction} href="/dashboard/report">
                Report a concern
                <Arrow />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.secondary} aria-labelledby="other-contact-title">
        <div className={styles.secondaryInner}>
          <h2 id="other-contact-title">Other ways to continue.</h2>
          <div className={styles.secondaryGrid}>
            <div className={styles.secondaryItem}>
              <h3>Speak with the team</h3>
              <p>If a call is easier, you can reach the team directly.</p>
              <a href="tel:+6589933786">Call +65 8993 3786 <span aria-hidden="true">↗</span></a>
            </div>

            <div className={styles.secondaryItem}>
              <h3>Customer login</h3>
              <p>Open your account to find a project and its order reference.</p>
              <Link href="/login">Sign in to your account <span aria-hidden="true">→</span></Link>
            </div>

            <div className={`${styles.secondaryItem} ${styles.safetyItem}`}>
              <h3>Send information safely</h3>
              <p>Include the service name and your question. For an existing project, add the order reference. Never send card details, passwords, or identity documents through WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
