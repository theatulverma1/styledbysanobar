"use client";

import { useEffect } from "react";

/* High-ticket single-page funnel: reveal-on-scroll (fail-open) + a sticky book
   bar that appears once the hero is scrolled past and hides again at the finale
   so it never doubles a visible CTA. Pure progressive enhancement: with JS off,
   all content is visible and the sticky bar simply never shows. */
export default function FunnelScripts() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.classList.add("js");

    // reveal-on-scroll
    const targets = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window && !reduce) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              io?.unobserve(e.target);
            }
          });
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
      );
      targets.forEach((t) => io!.observe(t));
    } else {
      targets.forEach((t) => t.classList.add("in"));
    }

    // sticky book bar: on between the hero sentinel and the finale sentinel
    const bar = document.querySelector<HTMLElement>(".hi-sticky");
    const heroEnd = document.querySelector<HTMLElement>("[data-sticky-start]");
    const finale = document.querySelector<HTMLElement>("[data-sticky-stop]");
    let past = false;
    let atEnd = false;
    const sync = () => {
      if (!bar) return;
      bar.classList.toggle("is-on", past && !atEnd);
    };
    let heroIo: IntersectionObserver | null = null;
    let endIo: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window && bar) {
      if (heroEnd) {
        heroIo = new IntersectionObserver(
          ([e]) => { past = !e.isIntersecting && e.boundingClientRect.top < 0; sync(); },
          { threshold: 0 }
        );
        heroIo.observe(heroEnd);
      }
      if (finale) {
        endIo = new IntersectionObserver(
          ([e]) => { atEnd = e.isIntersecting; sync(); },
          { rootMargin: "0px 0px -40% 0px" }
        );
        endIo.observe(finale);
      }
    }

    return () => {
      io?.disconnect();
      heroIo?.disconnect();
      endIo?.disconnect();
    };
  }, []);

  return null;
}
