import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getActiveOfferings } from "@/lib/offerings";
import { formatCents } from "@/lib/orders";
import styles from "./wakaf.module.css";

export const metadata: Metadata = {
  title: "Wakaf & Community Giving",
  description: "Explore Wakaf Water Pump, Wakaf Quran, and Food for Orphans with As-Sabiqun.",
};

const projects = [
  {
    slug: "water-pump", category: "water", number: "01", title: "Wakaf Water Pump",
    description: "Help establish a clean-water point through an approved fulfilment partner.",
    evidence: "Location details, photos, and video after review",
    image: "/landing-water-point.png", alt: "A community water point in use", tone: "water", featured: true,
  },
  {
    slug: "quran", category: "quran", number: "02", title: "Wakaf Quran",
    description: "Support Quran copies placed where learning and worship can continue.",
    evidence: "Distribution details and completion record",
    image: "/landing-quran-table.png", alt: "Copies of the Quran arranged on a table", tone: "quran", featured: false,
  },
  {
    slug: "food-for-orphans", category: "orphans", number: "03", title: "Food for Orphans",
    description: "Contribute towards a coordinated food programme for children in need.",
    evidence: "Delivery update and reviewed evidence",
    image: "/landing-hero-volunteers.png", alt: "Volunteers handing over a food parcel beside a delivery van", tone: "orphans", featured: false,
  },
] as const;

export default async function WakafPage() {
  const offerings = await getActiveOfferings();
  const minimumByCategory = new Map<string, number>();

  for (const offering of offerings.filter((item) => item.service_type === "wakaf")) {
    const amount = offering.min_amount ?? offering.unit_amount;
    if (amount && amount < (minimumByCategory.get(offering.category_slug) ?? Infinity)) {
      minimumByCategory.set(offering.category_slug, amount);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <header className={styles.introduction}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/services">Services</Link><span aria-hidden="true">/</span><span>Wakaf</span>
          </nav>
          <div className={styles.introGrid}>
            <h1>Choose where your giving continues.</h1>
            <div>
              <p>Select a cause, choose your contribution, and keep the request connected to its completion record.</p>
              <Link href="#wakaf-options" className={styles.textLink}>View the three options <span aria-hidden="true">↓</span></Link>
            </div>
          </div>
        </header>

        <section className={styles.catalogue} id="wakaf-options" aria-labelledby="wakaf-options-title">
          <div className={styles.sectionHeading}>
            <div>
              <span>Wakaf & community giving</span>
              <h2 id="wakaf-options-title">Three clear ways to contribute.</h2>
            </div>
            <p>Each option shows its current minimum before you begin. Your contribution details remain attached to the order as the work is coordinated.</p>
          </div>

          <div className={styles.projectGrid}>
            {projects.map((project) => {
              const minimum = minimumByCategory.get(project.category);
              const price = minimum != null ? `From ${formatCents(minimum)}` : "Pricing temporarily unavailable";
              return (
                <Link
                  href={`/wakaf/${project.slug}`}
                  key={project.slug}
                  className={`${styles.projectCard} ${styles[project.tone]} ${project.featured ? styles.featured : ""}`}
                  aria-label={`${project.title}, ${price}`}
                >
                  <div className={styles.cardMedia}>
                    <Image
                      src={project.image}
                      alt={project.alt}
                      fill
                      sizes={project.featured ? "(max-width: 800px) 100vw, 58vw" : "(max-width: 800px) 100vw, 38vw"}
                      loading={project.featured ? "eager" : "lazy"}
                      fetchPriority={project.featured ? "high" : "auto"}
                      unoptimized
                    />
                  </div>
                  <div className={styles.cardCopy}>
                    <div className={styles.cardTopline}><span>{project.number}</span><span className={styles.price}>{price}</span></div>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <div className={styles.evidence}><span>Completion record</span><strong>{project.evidence}</strong></div>
                    <div className={styles.cardAction}><span>Choose this Wakaf</span><span aria-hidden="true">→</span></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className={styles.assurance} aria-labelledby="assurance-title">
          <div>
            <span>One shared standard</span>
            <h2 id="assurance-title">Your choice changes the work, not the accountability.</h2>
          </div>
          <p>Whichever service you choose, the request is kept with the correct project, coordinated through an approved partner, and supported by reviewed completion evidence.</p>
        </section>
      </div>
    </main>
  );
}
