"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const platformItems = [
  {
    title: "Islamic Services",
    description: "Korban, wakaf, food support, and transparent giving updates.",
    href: "/services",
    tone: "green",
  },
  {
    title: "Islamic Business Consultancy",
    description: "Practical, values-led support for organisations and community ventures.",
    tone: "coral",
  },
  {
    title: "AI Automation",
    description: "Thoughtful systems that remove repetitive work and keep teams moving.",
    tone: "blue",
  },
] as const;

function Chevron({ open = false }: { open?: boolean }) {
  return (
    <svg className={open ? "is-open" : undefined} viewBox="0 0 12 8" aria-hidden="true">
      <path d="m1 1 5 5 5-5" />
    </svg>
  );
}

function PlatformIcon({ tone }: { tone: (typeof platformItems)[number]["tone"] }) {
  return <span className={`asb-platform-menu-icon asb-platform-menu-icon-${tone}`} aria-hidden="true" />;
}

export function LandingNav() {
  const [platformOpen, setPlatformOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setPlatformOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPlatformOpen(false);
        menuRef.current?.querySelector<HTMLButtonElement>(".asb-platform-trigger")?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <header className="asb-nav-wrap">
      <div className="asb-nav">
        <Link href="/" className="asb-brand" aria-label="As-Sabiquun home">
          <span className="asb-brand-seal" aria-hidden="true">
            <Image src="/brand/as-sabiquun-seal.png" width={2000} height={2000} sizes="36px" alt="" />
          </span>
          <span>As-Sabiquun</span>
        </Link>

        <nav className="asb-desktop-nav" aria-label="Main navigation">
          <div
            ref={menuRef}
            className={`asb-platform-menu${platformOpen ? " is-open" : ""}`}
            onMouseEnter={() => setPlatformOpen(true)}
            onMouseLeave={() => setPlatformOpen(false)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setPlatformOpen(false);
            }}
          >
            <button
              type="button"
              className="asb-platform-trigger"
              aria-expanded={platformOpen}
              aria-controls="asb-platform-dropdown"
              onFocus={() => setPlatformOpen(true)}
              onClick={() => setPlatformOpen(true)}
            >
              Services <Chevron open={platformOpen} />
            </button>
            <div
              id="asb-platform-dropdown"
              className="asb-platform-dropdown"
              aria-label="As-Sabiquun services"
              aria-hidden={!platformOpen}
            >
              <div className="asb-platform-dropdown-grid">
                {platformItems.map((item) => {
                  const content = (
                    <>
                      <PlatformIcon tone={item.tone} />
                      <span className="asb-platform-dropdown-copy">
                        <span className="asb-platform-dropdown-title">
                          {item.title}
                          {!("href" in item) && <small>Coming soon</small>}
                        </span>
                        <span className="asb-platform-dropdown-description">{item.description}</span>
                      </span>
                    </>
                  );

                  return "href" in item ? (
                    <Link key={item.title} href={item.href} className="asb-platform-dropdown-item" onClick={() => setPlatformOpen(false)}>
                      {content}
                    </Link>
                  ) : (
                    <div key={item.title} className="asb-platform-dropdown-item is-disabled" aria-disabled="true">
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <Link href="/about">About</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        <div className="asb-nav-actions">
          <Link href="/login" className="asb-nav-text-link">Login</Link>
          <Link href="/services" className="asb-nav-cta">Pick a service</Link>
          <details className="asb-mobile-menu">
            <summary className="asb-nav-menu" aria-label="Open navigation menu"><i /><i /></summary>
            <div className="asb-mobile-menu-panel">
              <span className="asb-mobile-menu-label">Services</span>
              <Link href="/services">Islamic Services</Link>
              <span className="asb-mobile-menu-pending">Islamic Business Consultancy <small>Coming soon</small></span>
              <span className="asb-mobile-menu-pending">AI Automation <small>Coming soon</small></span>
              <Link href="/about">About</Link>
              <Link href="/#how">How it works</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/login">Login</Link>
              <Link href="/services" className="asb-mobile-menu-cta">Pick a service</Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
