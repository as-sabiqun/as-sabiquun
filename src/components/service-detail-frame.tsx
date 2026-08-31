import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./service-detail-frame.module.css";

interface ServiceDetailFrameProps {
  family: string;
  familyHref: string;
  title: string;
  promise: string;
  price: string;
  priceNote: string;
  imageSrc: string;
  imageAlt: string;
  imagePosition?: string;
  children: ReactNode;
}

export function ServiceDetailFrame({
  family,
  familyHref,
  title,
  promise,
  price,
  priceNote,
  imageSrc,
  imageAlt,
  imagePosition = "center",
  children,
}: ServiceDetailFrameProps) {
  return (
    <div className={styles.frame}>
      <header className={styles.introduction}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href={familyHref}>{family}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title}</span>
        </nav>
        <div className={styles.introGrid}>
          <h1>{title}</h1>
          <div className={styles.summary}>
            <p>{promise}</p>
            <p className={styles.price}>
              <strong>{price}</strong>
              <span>{priceNote}</span>
            </p>
          </div>
        </div>
      </header>

      <div className={styles.chapter}>
        <figure className={styles.figure}>
          <div className={styles.imageWrap}>
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              fetchPriority="high"
              unoptimized
              sizes="(max-width: 900px) 100vw, 56vw"
              style={{ objectPosition: imagePosition }}
            />
          </div>
          <figcaption>
            Illustrative service image. Completion evidence for your order is provided separately after review.
          </figcaption>
        </figure>

        <section className={styles.decision} aria-label={`${title} request details`}>
          {children}
        </section>
      </div>

      <section className={styles.followThrough} aria-labelledby="service-follow-through-title">
        <div className={styles.followHeading}>
          <div>
            <span>After you continue</span>
            <h2 id="service-follow-through-title">Your request stays connected to the work.</h2>
          </div>
          <p>From order creation to the completion record, the details you provide remain part of one reviewed service trail.</p>
        </div>

        <ol className={styles.stages}>
          <li>
            <span className={styles.stageNumber}>01</span>
            <h3>Kept with the order</h3>
            <p>Your request or contribution, together with any participant names or dedication, remains attached to the correct order.</p>
          </li>
          <li>
            <span className={styles.stageNumber}>02</span>
            <h3>Coordinated for fulfilment</h3>
            <p>The service is coordinated with the approved partner assigned to carry out the work.</p>
          </li>
          <li>
            <span className={styles.stageNumber}>03</span>
            <h3>Reviewed before delivery</h3>
            <p>Submitted completion evidence is reviewed before you receive the completion record.</p>
          </li>
        </ol>
      </section>
    </div>
  );
}
