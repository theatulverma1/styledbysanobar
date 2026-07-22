"use client";

import { useEffect } from "react";

/* Reveals (fail-open) + the fitting-room dim transition into the quiz.
   All progressive enhancement: with JS off, content is visible and the CTA is a
   plain link to /quiz. */
export default function EntryScripts() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // mark JS on so .reveal can start hidden and animate in
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
      targets.forEach((t) => t.classList.add("in")); // reduced motion: show at once
    }

    // the fitting-room dim, then route into the quiz
    const onCta = (e: Event) => {
      const link = (e.currentTarget as HTMLAnchorElement);
      const href = link.getAttribute("href") || "/book";
      if (reduce) return; // let the plain navigation happen
      e.preventDefault();
      document.body.classList.add("dimming");
      window.setTimeout(() => {
        window.location.href = href;
      }, 720);
    };
    const ctas = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[data-dim]"));
    ctas.forEach((c) => c.addEventListener("click", onCta));

    return () => {
      io?.disconnect();
      ctas.forEach((c) => c.removeEventListener("click", onCta));
    };
  }, []);

  return null;
}
