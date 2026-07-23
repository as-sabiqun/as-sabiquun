import type { Metadata } from "next";
import { CatalogCard, services } from "@/components/service-card";

export const metadata: Metadata = {
  title: "Services",
  description: "Explore Korban, Wakaf Water Pump, Wakaf Quran, and Food for Orphans with As-Sabiqun.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="catalog-header">
        <div className="container">
          <p className="eyebrow-label">Our services</p>
          <h1 className="display">Choose what you want to arrange.</h1>
          <p className="lede">Four focused ways to contribute right now. Each one follows the same standard of care - clear scope, human coordination, and a documented completion record.</p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container">
          <div className="catalog-grid">
            {services.map((service) => <CatalogCard key={service.slug} service={service} />)}
          </div>
        </div>
      </section>
    </>
  );
}
