import { randomUUID } from "node:crypto";
import Link from "next/link";
import { KorbanContent } from "@/components/korban-content";
import { getActiveOfferings } from "@/lib/offerings";

export default async function KorbanPage() {
  const offerings = await getActiveOfferings();
  const packages = offerings.filter((offering) => offering.service_type === "korban" && offering.unit_amount)
    .map((offering) => ({ id: offering.slug, label: offering.title.replace(/^Korban\s*[—–-]\s*/i, ""), priceCents: offering.unit_amount! }));
  return (
    <section className="product-page service-detail-page">
      <div>
          {packages.length ? (
            <KorbanContent initialRequestId={randomUUID()} packages={packages} />
          ) : (
            <div className="panel p-8 text-center">
              <h1 className="display text-3xl">Korban bookings are temporarily unavailable</h1>
              <p className="mt-3 text-sm text-[var(--muted)]">Package availability is being updated. Please check again shortly or contact us.</p>
              <Link className="btn mt-6" href="/contact">Contact us</Link>
            </div>
          )}
      </div>
    </section>
  );
}
