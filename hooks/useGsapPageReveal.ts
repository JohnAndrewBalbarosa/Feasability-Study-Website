"use client";

import { RefObject, useLayoutEffect } from "react";
import gsap from "gsap";

const NO_DEPENDENCIES: readonly unknown[] = [];

export function useGsapPageReveal(scopeRef: RefObject<HTMLElement>, dependencies?: readonly unknown[]): void {
  useLayoutEffect(() => {
    if (!scopeRef.current) {
      return;
    }

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });

        timeline.from(".hero", {
          y: 26,
          autoAlpha: 0,
          duration: 0.55
        });

        timeline.from(
          ".hero .nav a, .hero .nav button",
          {
            y: 12,
            autoAlpha: 0,
            stagger: 0.04,
            duration: 0.35
          },
          "<0.05"
        );

        timeline.from(
          ".card",
          {
            y: 18,
            autoAlpha: 0,
            stagger: 0.06,
            duration: 0.45
          },
          "<0.08"
        );

        const rows = gsap.utils.toArray<HTMLTableRowElement>(".ops-table tbody tr").slice(0, 12);
        if (rows.length > 0) {
          timeline.from(
            rows,
            {
              x: -12,
              autoAlpha: 0,
              stagger: 0.02,
              duration: 0.22
            },
            "<0.03"
          );
        }
      }, scopeRef);

      return () => {
        ctx.revert();
      };
    });

    return () => {
      media.revert();
    };
  }, dependencies ?? NO_DEPENDENCIES);
}
