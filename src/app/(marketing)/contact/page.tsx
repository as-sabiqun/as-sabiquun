import type { Metadata } from "next";
import { ContactForm } from "@/components/forms";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact As-Sābiqūn about Islamic services, partnerships, or the platform.",
};

export default function ContactPage() {
  return (
    <>
      <section className="page-hero contact-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Contact us · تَوَاصَلْ مَعَنَا</p>
            <h1 className="display mt-6 max-w-4xl text-[clamp(3.2rem,7vw,6rem)] leading-[.9]">Let’s begin with<br /><span className="text-[var(--teal)]">what you need.</span></h1>
          </div>
          <p className="lead max-w-md">Ask about a service, a fulfilment partnership, or the platform. The team will follow up once live communications are connected.</p>
        </div>
      </section>

      <section className="section contact-section" id="contact-form">
        <div className="container grid items-start gap-14 lg:grid-cols-[.72fr_1.28fr]">
          <div>
            <p className="eyebrow">Speak with the team</p>
            <h2 className="section-title mt-4">A human answer, from the start.</h2>
            <p className="lead mt-6">For now, use the preview form or call the public contact number below.</p>
            <div className="contact-details mt-10">
              <div><span>Phone</span><a href="tel:+6589933786">+65 8993 3786</a></div>
              <div><span>Location</span><p>Singapore</p></div>
              <div><span>Socials</span><p>Instagram · Facebook · TikTok · Telegram <small>Coming soon</small></p></div>
            </div>
            <div className="preview-note mt-9"><strong>Form preview</strong><p>Submissions are shown in the demonstration dashboard. Automated email follow-up will be connected in a later build phase.</p></div>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
