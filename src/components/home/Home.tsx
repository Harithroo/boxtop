"use client";
// The home page: smooth scrolling, the section dock, and the sections in order. Each section owns its own
// animation and cleans it up; this file only provides what they share.
import "./register";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { homeBus } from "@/lib/home-bus";
import type { HomeBox, HomeChapter, HomeItem, HomeOccasion, HomeStyle } from "@/lib/home-data";
import { coarsePointer, reducedMotion, scrollToEl, scroller, siteEl } from "@/components/site/scroll";
import { Abroad } from "./Abroad";
import { Builder } from "./Builder";
import { Collection } from "./Collection";
import { Hero, type HeroCard } from "./Hero";
import { Journey } from "./Journey";
import { later } from "./later";
import { NOSCRIPT_CSS } from "./noscript-css";
import { Unbox } from "./Unbox";
import { YearDial } from "./YearDial";

export type HomeProps = {
  today: string; wa: string; waDisplay: string; instagram: string; igHandle: string; facebook: string; hours: string; payLine: string;
  proof: string; areas: string[]; quotes: { text: string; by: string }[]; abroad: boolean; fromPrice: string | null;
  hero: [HeroCard, HeroCard, HeroCard];
  chapters: HomeChapter[]; shelved: HomeBox[]; boxes: HomeBox[]; occasions: HomeOccasion[]; occasionNames: string[];
  items: HomeItem[]; styles: HomeStyle[]; starter: number[];
};

const svg = { viewBox: "0 0 24 24", "aria-hidden": true };
const DOCK: { sec: string; label: string; icon: React.ReactNode }[] = [
  { sec: "unbox", label: "Inside", icon: <svg {...svg}><path d="M3.5 8.5 12 4l8.5 4.5v7L12 20l-8.5-4.5z" /><path d="M3.5 8.5 12 13l8.5-4.5M12 13v7" /></svg> },
  { sec: "collection", label: "Boxes", icon: <svg {...svg}><path d="M20 12.5 12.5 20a1.4 1.4 0 0 1-2 0L4 13.5V4h9.5L20 10.5a1.4 1.4 0 0 1 0 2z" /><circle cx="8.5" cy="8.5" r="1.5" /></svg> },
  { sec: "build", label: "Build", icon: <svg {...svg}><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M3 9h18M12 9v11M12 9C10 5 7 5 7.5 7.5S12 9 12 9zm0 0c2-4 5-4 4.5-1.5S12 9 12 9z" /></svg> },
  { sec: "year", label: "Occasions", icon: <svg {...svg}><rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></svg> },
  { sec: "abroad", label: "Abroad", icon: <svg {...svg}><path d="M21 15.5 13 11V5.5a1.5 1.5 0 0 0-3 0V11l-8 4.5v2l8-2.5v4l-2 1.5v1.5l3.5-1 3.5 1V20l-2-1.5v-4l8 2.5z" /></svg> },
  { sec: "order", label: "Order", icon: <svg {...svg}><path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7z" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" /></svg> },
];

/** The floating section dock, with a pill that slides to the section on screen. */
function Dock({ secs }: { secs: string[] }) {
  const dock = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = dock.current!, site = siteEl();
    const pill = el.querySelector<HTMLElement>(".dock-pill")!, links = Array.from(el.querySelectorAll<HTMLAnchorElement>("a"));
    const targets = links.map((a) => document.getElementById(a.dataset.sec!));
    let on: HTMLAnchorElement | null = null;
    const movePill = (a: HTMLAnchorElement | null) => {
      if (!a) { pill.style.width = "0px"; return; }
      pill.style.left = a.offsetLeft + "px"; pill.style.width = a.offsetWidth + "px";
    };
    const covered = (t: Element | null) => { if (!t) return false; const r = t.getBoundingClientRect(); return r.top <= 1 && r.bottom >= window.innerHeight - 1; };
    const spy = () => {
      const mid = window.innerHeight * 0.45;
      let now: HTMLAnchorElement | null = null;
      targets.forEach((s, n) => { if (!s) return; const r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) now = links[n]; });
      if (now !== on) {
        on = now;
        links.forEach((a) => { a.classList.toggle("is-on", a === on); if (a === on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
        movePill(on);
      }
      // the dock steps aside while a full-screen pinned scene needs the bottom edge
      const pinned = ["unbox", "collection", "journey", ...(site?.classList.contains("yr-pin") ? ["year"] : [])].some((id) => covered(document.getElementById(id)));
      // ...and at the end of the page, where the poster's last line sits
      const atEnd = document.documentElement.scrollHeight - window.innerHeight - window.scrollY < 140;
      const show = window.scrollY > window.innerHeight * 0.7 && !pinned && !atEnd && !site?.classList.contains("menu-open");
      el.classList.toggle("show", show); site?.classList.toggle("dock-on", show);
    };
    const onResize = () => movePill(on);
    window.addEventListener("scroll", spy, { passive: true });
    window.addEventListener("resize", onResize);
    spy();
    return () => { window.removeEventListener("scroll", spy); window.removeEventListener("resize", onResize); site?.classList.remove("dock-on"); };
  }, []);
  return (
    <nav className="dock" id="dock" ref={dock} aria-label="On this page">
      <span className="dock-pill" aria-hidden="true" />
      {DOCK.filter((d) => secs.includes(d.sec)).map((d) => (
        <a key={d.sec} href={`#${d.sec}`} data-sec={d.sec} aria-label={d.label} onClick={(e) => { e.preventDefault(); scrollToEl(document.getElementById(d.sec)); }}>{d.icon}<span>{d.label}</span></a>
      ))}
    </nav>
  );
}

export function Home(p: HomeProps) {
  const hasShelf = p.shelved.length > 0, hasYear = p.occasions.length > 0;

  useEffect(() => {
    // Smooth wheel scrolling for mice and trackpads only; touch screens and reduced motion scroll natively.
    let lenis: Lenis | null = null;
    let tick: ((t: number) => void) | null = null;
    if (!coarsePointer() && !reducedMotion()) {
      try {
        lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
        lenis.on("scroll", ScrollTrigger.update);
        tick = (t) => lenis!.raf(t * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        scroller.lenis = lenis;
        if (document.documentElement.classList.contains("bt-lock")) lenis.stop(); // the intro is playing
      } catch { lenis = null; }
    }
    // Sections pin in page order, and each measured itself as it was made. GSAP follows up with one full
    // refresh in the next frame; register.ts measures again later only if photos or fonts moved something.

    // Arriving with a section in the address (/#build), or from a box page's "tweak this box" link (/?tweak=slug).
    // Queued behind the sections' own setup (useGSAPLater), so their pins have made room by the time it measures.
    const arrive = () => {
      const tweak = new URLSearchParams(window.location.search).get("tweak");
      const box = tweak ? p.boxes.find((b) => b.slug === tweak) : null;
      if (box) homeBus.emit("preset", box.id);
      else if (window.location.hash.length > 1) {
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
        if (target) { const y = target.getBoundingClientRect().top + window.scrollY - 10; if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); }
      }
    };
    let t = 0;
    const unqueue = later(() => { t = window.setTimeout(arrive, 120); });

    return () => {
      unqueue();
      window.clearTimeout(t);
      if (tick) gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis?.destroy();
      scroller.lenis = null;
    };
    // runs once: the box list only matters for the address check at arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const secs = ["unbox", ...(hasShelf ? ["collection"] : []), "build", ...(hasYear ? ["year"] : []), ...(p.abroad ? ["abroad"] : []), "order"];

  return (
    <div className="home home-page" id="home">
      <Dock secs={secs} />
      <Hero cards={p.hero} proof={p.proof} fromPrice={p.fromPrice} next={p.occasions[0] ? { name: p.occasions[0].name, when: p.occasions[0].when } : null} />
      <Unbox />
      {hasShelf && <Collection chapters={p.chapters} boxes={p.shelved} />}
      <Builder styles={p.styles} items={p.items} occasions={p.occasionNames} boxes={p.boxes} starter={p.starter} wa={p.wa} waDisplay={p.waDisplay} />
      {hasYear && <YearDial occasions={p.occasions} boxes={p.boxes} today={p.today} />}
      {p.abroad && <Abroad wa={p.wa} />}
      <Journey wa={p.wa} waDisplay={p.waDisplay} instagram={p.instagram} igHandle={p.igHandle} facebook={p.facebook} hours={p.hours} payLine={p.payLine} proof={p.proof} areas={p.areas} quotes={p.quotes} />
      <noscript><style dangerouslySetInnerHTML={{ __html: NOSCRIPT_CSS }} /></noscript>
    </div>
  );
}
