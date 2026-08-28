"use client";

import { useEffect } from "react";

export function ScrollGeometry() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".asb-landing");
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const progress = reduceMotion.matches
        ? 1
        : Math.min(1, Math.max(0, window.scrollY / 620));

      root.style.setProperty("--asb-hero-progress", progress.toFixed(4));
      root.style.setProperty("--asb-hero-radius-x", `${Math.round(560 * (1 - progress))}px`);
      root.style.setProperty("--asb-hero-radius-y", `${Math.round(92 * (1 - progress))}px`);
      root.style.setProperty("--asb-hero-rotation", `${-7 + progress * 7}deg`);
      root.style.setProperty("--asb-hero-halo-rotation", `${-8 + progress * 8}deg`);
      root.style.setProperty("--asb-hero-scale-x", (1 + progress * .2).toFixed(4));
      root.style.setProperty("--asb-hero-scale-y", (1 + progress * .08).toFixed(4));
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduceMotion.addEventListener("change", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduceMotion.removeEventListener("change", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
