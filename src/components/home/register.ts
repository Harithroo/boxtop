// GSAP plugins are registered once, before any section's effects run. This file also decides when the page is
// measured again, because on the home page that is the single most expensive thing the scripts do.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* A full refresh un-pins every scene, measures the whole page and pins it all again. GSAP runs one by itself in
   the frame after a pin is created, and that is the one the page needs. The load event, the fonts arriving and
   the intro ending each used to ask for another, whether or not anything had moved; now they ask settle(). */
let measured = "";
// What a refresh depends on: the width text wraps to, the height of the page, and the one strip that is wider
// than the screen (the pegged boxes), whose length sets how far its pinned scene scrolls.
const box = () => `${document.documentElement.clientWidth}|${document.documentElement.scrollHeight}|${document.getElementById("clTrack")?.scrollWidth ?? 0}`;

/** Measure every section again, sorted in page order. */
export function remeasure() {
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}

/** Measure again only if the page is no longer the size it was at the last full refresh. */
export function settle() {
  if (measured !== box()) remeasure();
}

if (typeof window !== "undefined") {
  // GSAP's own refresh on DOMContentLoaded and on load is unconditional; settle() answers the load event instead.
  ScrollTrigger.config({ autoRefreshEvents: "visibilitychange,resize" });
  ScrollTrigger.addEventListener("refresh", () => { measured = box(); });
  window.addEventListener("load", settle);
  // The fonts are preloaded, so they are normally in before any section is measured. If they arrive after, text
  // has changed width inside sections in ways the page's outer size may not show: measure regardless.
  document.fonts?.ready.then(() => { if (ScrollTrigger.getAll().length) remeasure(); }).catch(() => {});
}
