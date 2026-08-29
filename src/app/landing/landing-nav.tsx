"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const platformItems = [
  {
    title: "Korban",
    description: "Choose a Korban package and receive a clear completion record.",
    href: "/korban",
    tone: "green",
  },
  {
    title: "Wakaf Water Pump",
    description: "Help provide clean water with location details, photos, and video.",
    href: "/wakaf/water-pump",
    tone: "blue",
  },
  {
    title: "Wakaf Quran",
    description: "Place Quran copies where learning and worship can continue.",
    href: "/wakaf/quran",
    tone: "coral",
  },
  {
    title: "Food for Orphans",
    description: "Provide meals for orphans and receive an update after delivery.",
    href: "/wakaf/food-for-orphans",
    tone: "pink",
  },
  {
    title: "Islamic Business Consultancy",
    description: "Practical, values-led support for organisations and community ventures.",
    tone: "blue",
  },
  {
    title: "AI Automation",
    description: "Thoughtful systems that remove repetitive work and keep teams moving.",
    tone: "green",
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
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  const suppressFocusOpenRef = useRef(false);

  const closeMobileMenu = () => {
    mobileMenuRef.current?.removeAttribute("open");
  };

  useEffect(() => {
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;

      if (!menuRef.current?.contains(event.target)) setPlatformOpen(false);
      if (!mobileMenuRef.current?.contains(event.target)) {
        mobileMenuRef.current?.removeAttribute("open");
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const trigger = menuRef.current?.querySelector<HTMLButtonElement>(".asb-platform-trigger");
        if (menuRef.current?.contains(document.activeElement)) {
          suppressFocusOpenRef.current = true;
          trigger?.focus({ preventScroll: true });
          // focus() dispatches synchronously; clear this immediately so the
          // next genuine Tab entry still opens the disclosure, even in a
          // background tab where animation frames can be paused.
          suppressFocusOpenRef.current = false;
        }
        setPlatformOpen(false);

        if (mobileMenuRef.current?.hasAttribute("open")) {
          mobileMenuRef.current.removeAttribute("open");
          mobileMenuRef.current.querySelector<HTMLElement>("summary")?.focus({ preventScroll: true });
        }
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
            <Image src="/brand/as-sabiquun-seal.svg" width={802} height={800} sizes="48px" alt="" priority />
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
              onFocus={() => {
                if (!suppressFocusOpenRef.current) setPlatformOpen(true);
              }}
              // Hover/focus can precede a pointer click; a click should never
              // undo the menu the pointer is actively trying to enter. Native
              // keyboard activation reports detail 0 and keeps toggle semantics.
              onClick={(event) => {
                if (event.detail === 0) setPlatformOpen((open) => !open);
                else setPlatformOpen(true);
              }}
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
                <Link
                  href="/#amanah"
                  className="asb-platform-dropdown-item asb-platform-dropdown-item-giving"
                  onClick={() => setPlatformOpen(false)}
                >
                  <PlatformIcon tone="green" />
                  <span className="asb-platform-dropdown-copy">
                    <span className="asb-platform-dropdown-title">Giving Updates</span>
                    <span className="asb-platform-dropdown-description">Follow each act of giving through reviewed field evidence and progress notes.</span>
                  </span>
                </Link>
                <Link
                  href="/services"
                  className="asb-platform-dropdown-all"
                  onClick={() => setPlatformOpen(false)}
                >
                  <span>View all services</span>
                </Link>
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
          <details ref={mobileMenuRef} className="asb-mobile-menu">
            <summary className="asb-nav-menu" aria-label="Open navigation menu"><i /><i /></summary>
            <div className="asb-mobile-menu-panel">
              <span className="asb-mobile-menu-label">Services</span>
              {platformItems.map((item) => "href" in item ? (
                <Link key={item.title} href={item.href} onClick={closeMobileMenu}>{item.title}</Link>
              ) : (
                <span key={item.title} className="asb-mobile-menu-pending">{item.title} <small>Coming soon</small></span>
              ))}
              <Link href="/#amanah" onClick={closeMobileMenu}>Giving Updates</Link>
              <Link href="/services" className="asb-mobile-menu-all" onClick={closeMobileMenu}>View all services</Link>
              <Link href="/about" onClick={closeMobileMenu}>About</Link>
              <Link href="/#how" onClick={closeMobileMenu}>How it works</Link>
              <Link href="/contact" onClick={closeMobileMenu}>Contact</Link>
              <Link href="/login" onClick={closeMobileMenu}>Login</Link>
              <Link href="/services" className="asb-mobile-menu-cta" onClick={closeMobileMenu}>Pick a service</Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
