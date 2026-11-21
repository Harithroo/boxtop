// Scrolling helpers shared by the header, the dock and the home page sections.
// The home page registers its Lenis instance here; every other page glides by hand with the same curve.
import type Lenis from "lenis";

export const scroller: { lenis: Lenis | null } = { lenis: null };

export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const coarsePointer = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/* One glide for every jump: the time grows with the distance (the home page is very tall because of its pinned
   scenes), and it eases in as well as out, so it never lurches off the mark or slams to a stop. */
const glideEase = (t: number) => (t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2);
const glideTime = (d: number) => Math.min(2.6, Math.max(0.9, 0.75 + Math.sqrt(Math.abs(d)) / 70));

let raf = 0;
let bound = false;
function glideStop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

export function glideTo(y: number, done?: () => void) {
  if (!bound) {
    // a wheel, a finger or a key takes over from a hand-run glide
    bound = true;
    for (const ev of ["wheel", "touchstart", "keydown"]) window.addEventListener(ev, glideStop, { passive: true });
  }
  const max = document.documentElement.scrollHeight - window.innerHeight;
  y = Math.max(0, Math.min(max, Math.round(y)));
  const from = window.scrollY, d = y - from;
  const lenis = scroller.lenis;
  if (reducedMotion() || Math.abs(d) < 2) {
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
    done?.();
    return;
  }
  const dur = glideTime(d);
  if (lenis) { lenis.scrollTo(y, { duration: dur, easing: glideEase, force: true, onComplete: done }); return; }
  glideStop();
  const t0 = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / (dur * 1000));
    window.scrollTo(0, from + d * glideEase(p));
    if (p < 1) raf = requestAnimationFrame(step); else { raf = 0; done?.(); }
  };
  raf = requestAnimationFrame(step);
}

export function scrollToEl(t: Element | null | undefined, off?: number) {
  if (!t) return;
  const o = off != null ? off : t.id === "top" ? 0 : -10;
  glideTo(t.getBoundingClientRect().top + window.scrollY + o);
}

/** Freeze or release page scrolling (full-screen menu, intro). */
export function lockScroll(on: boolean) {
  document.documentElement.classList.toggle("bt-lock", on);
  if (on) scroller.lenis?.stop(); else scroller.lenis?.start();
}

/** The store shell. Section state classes (menu-open, cl-pin …) live here, where React never rewrites them. */
export const siteEl = () => document.getElementById("site");

/** Hold the CSS animations inside each element still while it is off screen (site.css [data-off]). A looping
    animation keeps the browser restyling every frame even where nobody can see it, and one on an SVG shape
    also lays out and repaints. Returns a function that lets them all run again. */
export function pauseOffscreen(els: Element[]): () => void {
  const io = new IntersectionObserver((es) => es.forEach((e) => e.target.toggleAttribute("data-off", !e.isIntersecting)));
  els.forEach((el) => io.observe(el));
  return () => { io.disconnect(); els.forEach((el) => el.removeAttribute("data-off")); };
}
