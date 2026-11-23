"use client";
// Eased mouse-wheel and trackpad scrolling on every store page (the admin has its own layout and keeps native
// scrolling). One Lenis instance for the whole store, registered in scroll.ts: the menu's and the intro's scroll
// lock pause it, the header's and the dock's jumps glide with it, and the home page ties its scroll-linked
// animations to it.
import { useEffect } from "react";
import Lenis from "lenis";
import { coarsePointer, reducedMotion, scroller } from "./scroll";

export function SmoothScroll() {
  useEffect(() => {
    // Touch screens and reduced motion scroll natively: the device's own scrolling is the right feel there.
    if (coarsePointer() || reducedMotion()) return;
    let lenis: Lenis;
    try {
      lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        // A panel that can scroll the way the wheel is going (a sideways row of chips, a modal's content)
        // scrolls itself, as it would without Lenis; at its end the page takes over.
        allowNestedScroll: true,
        // Clicking through to another page drops any glide still running, so it can't carry on over there.
        stopInertiaOnNavigate: true,
      });
    } catch {
      return;
    }
    scroller.lenis = lenis;
    // The home intro's pre-paint script may already have locked the page.
    if (document.documentElement.classList.contains("bt-lock")) lenis.stop();
    let raf = 0;
    const frame = (t: number) => {
      if (!scroller.driven) lenis.raf(t);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      scroller.lenis = null;
    };
  }, []);
  return null;
}
