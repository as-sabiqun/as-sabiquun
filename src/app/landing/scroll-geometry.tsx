"use client";

import { useEffect } from "react";

export function ScrollGeometry() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".asb-landing");
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileMenu = root.querySelector<HTMLDetailsElement>(".asb-mobile-menu");
    const documentRoot = document.documentElement;
    const previousScrollBehavior = documentRoot.style.scrollBehavior;
    documentRoot.style.scrollBehavior = "auto";
    let frame = 0;
    let lastScrollY = window.scrollY;
    let upwardTravel = 0;

    const closeMobileMenu = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("a")) {
        mobileMenu?.removeAttribute("open");
      }
    };

    const update = () => {
      frame = 0;
      const scrollY = window.scrollY;
      const hero = root.querySelector<HTMLElement>(".asb-hero");
      const flattenDistance = Math.min(400, (hero?.offsetHeight ?? 720) * 0.56);
      const heroFlatten = Math.min(1, Math.max(0, scrollY / flattenDistance));
      root.style.setProperty("--asb-hero-wave-depth", `${Math.round(92 * (1 - heroFlatten))}px`);
      const navBandY = 49;
      const overDarkBand = [".asb-values", ".asb-closing"].some((selector) => {
        const band = root.querySelector<HTMLElement>(selector);
        if (!band) return false;
        const rect = band.getBoundingClientRect();
        return rect.top <= navBandY && rect.bottom >= navBandY;
      });

      root.style.setProperty(
        "--asb-nav-surface",
        overDarkBand ? "rgba(229, 227, 242, .78)" : "rgba(255, 255, 255, .7)",
      );

      const delta = scrollY - lastScrollY;
      if (scrollY <= 12) {
        upwardTravel = 0;
        root.classList.remove("asb-announcement-hidden");
      } else if (delta > 3) {
        upwardTravel = 0;
        root.classList.add("asb-announcement-hidden");
      } else if (delta < -2) {
        upwardTravel += -delta;
        if (upwardTravel >= 72) root.classList.remove("asb-announcement-hidden");
      }
      lastScrollY = scrollY;
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const revealTargets = root.querySelectorAll<HTMLElement>(
      ".asb-platform-card, .asb-values-lead > *, .asb-values-entry, .asb-stories-lead > *, .asb-concept-film, .asb-story-card, .asb-closing-inner > *",
    );
    root.classList.add("asb-motion-ready");
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
    revealTargets.forEach((target) => revealObserver.observe(target));

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduceMotion.addEventListener("change", schedule);
    mobileMenu?.addEventListener("click", closeMobileMenu);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduceMotion.removeEventListener("change", schedule);
      mobileMenu?.removeEventListener("click", closeMobileMenu);
      revealObserver.disconnect();
      root.classList.remove("asb-motion-ready");
      root.classList.remove("asb-announcement-hidden");
      root.style.removeProperty("--asb-hero-wave-depth");
      documentRoot.style.scrollBehavior = previousScrollBehavior;
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
