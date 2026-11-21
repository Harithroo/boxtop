"use client";
// The journey's motion: pins the order story for four screens and plays each state's scene as its step comes up.
// The markup is drawn on the server (Journey.tsx) and handed in as children, so none of it is client code.
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAPLater } from "./register";
import { later } from "./later";
import { MM } from "./stickers";
import type { SiteTheme } from "@/lib/settings";

// the section's background per order step: light tints (ink-soft stays above 5.3:1 on every one), or night shades
const JBG = {
  light: ["#f5efe3", "#f2ebf5", "#f6efe2", "#efe8f5", "#f7ede4"],
  dark: ["#150c24", "#1c0f30", "#120a20", "#1a0e2e", "#210f2c"],
};

export function JourneyMotion({ theme, children }: { theme: SiteTheme; children: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useGSAPLater(() => {
    const sect = root.current!;
    const q = <T extends Element = HTMLElement>(sel: string, within: Element = sect) => within.querySelector<T>(sel)!;
    const qa = <T extends Element = HTMLElement>(sel: string, within: Element = sect) => Array.from(within.querySelectorAll<T>(sel));

    gsap.matchMedia().add(MM, (ctx) => {
      const { desk, motion } = ctx.conditions as { desk: boolean; motion: boolean };
      if (!motion) return;
      const jSteps = qa(".jr-step"), jNodes = qa(".jr-node"), jFill = q("#jrFill"), jTrav = q("#jrTrav"), journey = q("#journey"), pk = q("#pkStage");
      let jCur = -1;

      const scene1 = () => {
        const r = q(".sc1");
        return gsap.timeline({ paused: true })
          .fromTo(q(".s1-phone", r), { y: 50, rotation: -5, opacity: 0, transformOrigin: "50% 100%" }, { y: 0, rotation: 0, opacity: 1, duration: 0.7, ease: "back.out(1.5)" }, 0.2)
          .fromTo(q(".s1-tag", r), { scale: 0, rotation: -20, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, rotation: 6, opacity: 1, duration: 0.6, ease: "back.out(2.4)" }, 0.6)
          .fromTo(q(".s1-b1", r), { scale: 0, opacity: 0, transformOrigin: "100% 100%" }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" }, 0.8)
          .fromTo(q(".s1-t1", r), { opacity: 0 }, { opacity: 1, duration: 0.15 }, 1.2)
          .to(q(".s1-t1", r), { opacity: 0, duration: 0.15 }, 1.9)
          .fromTo(q(".s1-b2", r), { scale: 0, opacity: 0, transformOrigin: "0% 0%" }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.6)" }, 1.95)
          .fromTo(q(".s1-b3", r), { scale: 0, opacity: 0, transformOrigin: "100% 100%" }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" }, 2.7)
          .fromTo(q(".s1-t2", r), { opacity: 0 }, { opacity: 1, duration: 0.15 }, 3.1)
          .to(q(".s1-t2", r), { opacity: 0, duration: 0.15 }, 3.8)
          .fromTo(q(".s1-b4", r), { scale: 0, opacity: 0, transformOrigin: "0% 0%" }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.8)" }, 3.85);
      };
      const scene2 = () => {
        const r = q(".sc2");
        return gsap.timeline({ paused: true })
          .fromTo(qa(".s2-n", r), { rotation: 0, y: 40, opacity: 0, transformOrigin: "50% 100%" }, { rotation: (i) => [-16, -4, 9][i], y: (i) => [6, -4, -12][i], opacity: 1, duration: 0.7, stagger: 0.12, ease: "back.out(1.6)" }, 0.2)
          .fromTo(q(".s2-or", r), { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.5, ease: "back.out(3)" }, 0.6)
          .fromTo(q(".s2-slip", r), { y: 160, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, 0.5)
          .fromTo(q(".s2-corners", r), { scale: 1.3, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.45, ease: "power2.out" }, 1.2)
          .fromTo(q(".s2-flash", r), { opacity: 0 }, { opacity: 0.95, duration: 0.08, yoyo: true, repeat: 1 }, 1.75)
          .fromTo(q(".s2-stamp", r), { scale: 2.6, rotation: -30, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, rotation: 0, opacity: 1, duration: 0.45, ease: "back.out(2.2)" }, 2.05)
          .fromTo(q(".s2-slip", r), { x: 0 }, { x: 5, duration: 0.05, repeat: 5, yoyo: true, ease: "none" }, 2.3);
      };
      const scene3 = () =>
        gsap.timeline({ paused: true })
          .fromTo(q(".pk-veil", pk), { opacity: 0.9 }, { opacity: 0, duration: 2.2, ease: "power1.in" }, 0.3)
          .fromTo(qa(".pk-st", pk), { y: () => -pk.offsetHeight * 1.2, rotation: () => gsap.utils.random(-50, 50), opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.8, stagger: 0.17, ease: "bounce.out" }, 0.3)
          .fromTo(q(".pk-h", pk), { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power3.inOut" }, 2.2)
          .fromTo(q(".pk-v", pk), { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: "power3.inOut" }, 2.35)
          .fromTo(q(".pk-bow", pk), { scale: 0, rotation: -40, transformOrigin: "50% 60%" }, { scale: 1, rotation: 0, duration: 0.7, ease: "back.out(3)" }, 2.75)
          .fromTo(q(".pk-tag", pk), { rotation: 50, opacity: 0 }, { rotation: 0, opacity: 1, duration: 1.4, ease: "elastic.out(1,.35)" }, 3.0);
      const scene4 = () => {
        const r = q(".sc4");
        return gsap.timeline({ paused: true })
          .fromTo(q(".s4-van", r), { x: -520 }, { x: 0, duration: 1.3, ease: "power3.out" }, 0.2)
          .fromTo(q(".s4-card", r), { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(2)" }, 1.0);
      };
      const scene5 = () => {
        const r = q(".sc5"), bits = qa(".s5-conf > *", r);
        return gsap.timeline({ paused: true })
          .set(q(".s5-door", r), { scaleX: 1, transformOrigin: "0% 50%" }, 0)
          .fromTo(q(".s5-gift", r), { y: -300, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "bounce.out" }, 0.2)
          .to(q(".s5-door", r), { scaleX: 0.14, duration: 0.9, ease: "power2.inOut" }, 1.1)
          .fromTo(bits, { x: 0, y: 0, rotation: 0, opacity: 0 }, { x: () => gsap.utils.random(-230, 230), y: () => gsap.utils.random(-300, -60), rotation: () => gsap.utils.random(-360, 360), opacity: 1, duration: 0.9, stagger: 0.01, ease: "power3.out" }, 1.5)
          .to(bits, { y: "+=140", opacity: 0, duration: 1, stagger: 0.01, ease: "power1.in" }, 2.4)
          .fromTo(q(".s5-badge", r), { scale: 0, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(2.5)" }, 1.6)
          .fromTo(q(".s5-quote", r), { scale: 0, opacity: 0, transformOrigin: "100% 100%" }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" }, 2.1);
      };
      /* A scene is some thirty tweens, and its step stays hidden until goJ shows it. So a scene is drawn up the
         first time it is wanted rather than all five as the page loads: the idle queue has normally made it
         ready by then, and if not, it is made on the spot, before the step fades in. */
      const draw = [scene1, scene2, scene3, scene4, scene5];
      const SC: (gsap.core.Timeline | undefined)[] = [];
      const scene = (n: number) => (SC[n] ??= draw[n]());
      const unqueue = draw.map((_, n) => later(() => scene(n)));
      gsap.set(jSteps, { autoAlpha: 0 });
      const goJ = (n: number, dir: number) => {
        if (n === jCur) return;
        const prev = jCur; jCur = n;
        jSteps.forEach((st, k) => st.classList.toggle("is-active", k === n));
        if (prev > -1) { gsap.to(jSteps[prev], { autoAlpha: 0, y: -60 * dir, duration: 0.45, ease: "power2.in", overwrite: true }); SC[prev]?.pause(); }
        gsap.fromTo(jSteps[n], { autoAlpha: 0, y: 70 * dir }, { autoAlpha: 1, y: 0, duration: 0.75, delay: prev > -1 ? 0.2 : 0, ease: "power3.out", overwrite: true });
        gsap.fromTo(qa(".jr-text > *", jSteps[n]), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, delay: prev > -1 ? 0.3 : 0.1, ease: "power3.out", overwrite: true });
        gsap.to(journey, { backgroundColor: JBG[theme][n], duration: 0.8, ease: "power1.out" });
        scene(n).restart();
      };
      /* the order itself: its start states go on before any trigger is made, since making a trigger measures
         the page, and measuring between two changes makes the browser lay it all out again */
      const reviewsIn = gsap.from(".rv", { clipPath: "inset(0 0 100% 0)", duration: 0.9, stagger: 0.15, ease: "power3.out", paused: true });
      const factsIn = gsap.from(".or-side .fact", { y: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", paused: true });

      const tw = desk ? 46 : 31;
      ScrollTrigger.create({
        trigger: journey, start: "top top", end: () => "+=" + Math.round(window.innerHeight * 4), pin: true, invalidateOnRefresh: true,
        onUpdate: (self) => {
          /* the logo reaches node i exactly as step i fades in, then rests on Delivered for the last screen */
          const p = self.progress, f = Math.min(1, p * 1.25);
          jFill.style.transform = `scaleX(${f})`;
          jTrav.style.left = `calc(${tw}px + ${f.toFixed(4)} * (100% - ${tw * 2}px))`;
          jNodes.forEach((nd, k) => nd.classList.toggle("is-done", f >= k / 4 - 0.002));
          goJ(Math.min(4, Math.floor(p * 5)), self.direction || 1);
        },
      });
      // first reveal, unless the scroll position has already chosen a step (arriving by a jump or a link)
      ScrollTrigger.create({ trigger: journey, start: "top 70%", once: true, onEnter: () => { if (jCur === -1) goJ(0, 1); } });

      ScrollTrigger.create({ animation: reviewsIn, trigger: ".reviews", start: "top 88%", once: true });
      ScrollTrigger.create({ animation: factsIn, trigger: ".or-final", start: "top 80%", once: true });

      // scenes the idle queue drew up were made outside GSAP's bookkeeping, so they are put back by hand
      return () => { unqueue.forEach((stop) => stop()); SC.forEach((tl) => tl?.revert()); };
    });
  }, root);

  return <section id="order" aria-labelledby="dr-title" ref={root}>{children}</section>;
}
