import Link from "next/link";
import { CatalogCard, catalogServicesFrom } from "@/components/service-card";
import { getActiveOfferings } from "@/lib/offerings";

const categories = ["All", "Korban", "Wakaf"] as const;
type Category = (typeof categories)[number];

function categoryOf(slug: string): Category {
  return slug === "korban" ? "Korban" : "Wakaf";
}

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const requested = (await searchParams).category;
  const active: Category = requested === "korban" ? "Korban" : requested === "wakaf" ? "Wakaf" : "All";
  const services = catalogServicesFrom(await getActiveOfferings());
  const visible = active === "All" ? services : services.filter((service) => categoryOf(service.slug) === active);

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
              <Link
                key={category}
                className={`catalog-tab ${active === category ? "is-active" : ""}`}
                href={category === "All" ? "/services" : `/services?category=${category.toLowerCase()}`}
                aria-current={active === category ? "page" : undefined}
              >
                {category}
              </Link>
            ))}
            <span className="catalog-count ml-auto self-center">{visible.length} service{visible.length === 1 ? "" : "s"}</span>
          </div>

          {visible.length ? <div className="catalog-grid mt-6">{visible.map((service) => <CatalogCard key={service.slug} service={service} />)}</div> : <div className="panel mt-6 p-8 text-center"><h2 className="display text-xl">No services are available here right now</h2><p className="mt-2 text-sm text-[var(--muted)]">Please check again shortly or contact us.</p></div>}
        </div>
      </section>
    </>
  );
}
