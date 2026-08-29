import type { Metadata } from "next";
import Link from "next/link";
import { catalogServicesFrom } from "@/components/service-card";
import { getActiveOfferings } from "@/lib/offerings";
import { ServiceSelector } from "./service-selector";
import "./services.css";

export const metadata: Metadata = {
  title: "Services",
  description: "Choose a Korban or Wakaf service and follow it from your intention to a reviewed completion record.",
};

function Arrow() {
  return <svg viewBox="0 0 32 24" aria-hidden="true"><path d="M2 12h26M20 4l8 8-8 8" /></svg>;
}

export default async function ServicesPage() {
  const services = catalogServicesFrom(await getActiveOfferings());

  return (
    <div className="asb-services-page">
      <section className="asb-services-intro" aria-labelledby="services-page-title">
        <h1 id="services-page-title">Choose a service.</h1>
        <div>
          <p>See what each service supports, its starting contribution, and the record you receive afterwards.</p>
          <a href="#service-directory">Browse the directory <Arrow /></a>
        </div>
      </section>

      <section className="asb-services-chooser" id="service-directory" aria-label="Choose an available service">
        {services.length ? (
          <ServiceSelector services={services} />
        ) : (
          <div className="asb-services-empty">
            <h2>No services are available right now.</h2>
            <p>Please check again shortly, or speak with us about what you are hoping to arrange.</p>
            <Link href="/contact">Ask a question <Arrow /></Link>
          </div>
        )}
      </section>

      <section className="asb-services-method" id="record-process" aria-labelledby="services-method-title">
        <div className="asb-services-method-heading">
          <h2 id="services-method-title">What happens next.</h2>
          <p>Every service follows the same clear process.</p>
        </div>
        <ol>
          <li><span>Arrange</span><p>Your order is sent to an approved fulfilment partner.</p></li>
          <li><span>Review</span><p>We check the submitted completion evidence.</p></li>
          <li><span>Receive</span><p>Your record is sent to you and kept on your project page.</p></li>
        </ol>
      </section>

      <aside className="asb-services-help" aria-labelledby="services-help-title">
        <div>
          <h2 id="services-help-title">Need help choosing?</h2>
          <p>Tell us what you are hoping to arrange and we will point you towards the clearest next step.</p>
        </div>
        <Link href="/contact">Speak with us <Arrow /></Link>
      </aside>
    </div>
  );
}
