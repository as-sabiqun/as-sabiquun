"use client";

import { useEffect } from "react";

export function ScrollGeometry() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".asb-landing");
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileMenu = root.querySelector<HTMLDetailsElement>(".asb-mobile-menu");
    const storyViewport = root.querySelector<HTMLElement>(".asb-stories-viewport");
    const storyButtons = root.querySelectorAll<HTMLButtonElement>(".asb-story-controls button");
    let frame = 0;

    const closeMobileMenu = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("a")) {
        mobileMenu?.removeAttribute("open");
      }
    };

    const update = () => {
      frame = 0;
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

    const moveStories = (direction: number) => {
      if (!storyViewport) return;
      const card = storyViewport.querySelector<HTMLElement>(".asb-story-card");
      storyViewport.scrollBy({ left: direction * ((card?.offsetWidth ?? 360) + 30), behavior: reduceMotion.matches ? "auto" : "smooth" });
    };
    const previousStories = () => moveStories(-1);
    const nextStories = () => moveStories(1);
    storyButtons[0]?.addEventListener("click", previousStories);
    storyButtons[1]?.addEventListener("click", nextStories);

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
      storyButtons[0]?.removeEventListener("click", previousStories);
      storyButtons[1]?.removeEventListener("click", nextStories);
      revealObserver.disconnect();
      root.classList.remove("asb-motion-ready");
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
