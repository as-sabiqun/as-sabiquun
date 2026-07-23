"use client";

import { useState } from "react";
import { CatalogCard, services } from "@/components/service-card";

const categories = ["All", "Korban", "Wakaf"] as const;
type Category = (typeof categories)[number];

function categoryOf(slug: string): Category {
  return slug === "korban" ? "Korban" : "Wakaf";
}

export default function ServicesPage() {
  const [active, setActive] = useState<Category>("All");
  const visible = active === "All" ? services : services.filter((s) => categoryOf(s.slug) === active);

  return (
    <>
      <section className="catalog-header">
        <div className="container">
          <h1 className="display">Our Services</h1>
        </div>
      </section>

      <section className="py-10 lg:py-12">
        <div className="container">
          <div className="catalog-tabs">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`catalog-tab ${active === category ? "is-active" : ""}`}
                onClick={() => setActive(category)}
              >
                {category}
              </button>
            ))}
            <span className="catalog-count ml-auto self-center">{visible.length} service{visible.length === 1 ? "" : "s"}</span>
          </div>

          <div className="catalog-grid mt-6">
            {visible.map((service) => <CatalogCard key={service.slug} service={service} />)}
          </div>
        </div>
      </section>
    </>
  );
}
