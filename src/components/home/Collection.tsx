"use client";
// Boxes pegged to a ribbon. On a desktop the section pins and the strip travels sideways as you scroll, with a
// category rail and a progress line; on a phone it is a native swipe. Cards swing with the speed of travel.
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAPLater } from "./register";
import { homeBus } from "@/lib/home-bus";
import type { HomeBox, HomeChapter } from "@/lib/home-data";
import { rs } from "@/lib/format";
import { boxSources } from "@/lib/srcset";
import { Pic } from "@/components/Pic";
import { glideTo, reducedMotion, scrollToEl, siteEl } from "@/components/site/scroll";
import { soon } from "./later";
import { MM } from "./stickers";

const pad2 = (n: number) => (n < 10 ? "0" : "") + n;
// How wide a card's photo is drawn (home.css .tcard, .ph img): 118% of the card minus its 20px frame.
// Desktop uses the pinned card's width; the unpinned one (reduced motion) is a little wider and still fits.
const PH_SIZES = "(max-width: 899px) calc((68vw - 20px) * 1.18), calc((clamp(196px, 18vw, 286px) - 20px) * 1.18)";

export function Collection({ chapters, boxes }: { chapters: HomeChapter[]; boxes: HomeBox[] }) {
  const root = useRef<HTMLElement>(null);
  const go = useRef<(slug: string) => void>(() => {});

  useGSAPLater(() => {
    const sect = root.current!, site = siteEl();
    const track = sect.querySelector<HTMLElement>("#clTrack")!, vp = sect.querySelector<HTMLElement>("#clViewport")!;
    const line = sect.querySelector<SVGSVGElement>("#clLine")!, clNow = sect.querySelector<HTMLElement>("#clNow")!;
    const cards = gsap.utils.toArray<HTMLElement>(".tcard"), chips = gsap.utils.toArray<HTMLElement>("#clChips button");
    const reduce = reducedMotion();
    const pinned = () => !!site?.classList.contains("cl-pin");

    /* the ribbon the cards hang from: it sags a little between pegs */
    const drawLine = () => {
      // measure first, draw after: the line is laid over the track, so sizing it cannot move a peg
      const w = track.scrollWidth, y = 14, pegs = cards.map((c) => c.offsetLeft + c.offsetWidth / 2);
      line.setAttribute("width", String(w)); line.setAttribute("height", "90"); line.setAttribute("viewBox", `0 0 ${w} 90`);
      let d = "M0 " + y, prev = 0;
      pegs.concat([w]).forEach((x) => {
        const sag = Math.min(34, (x - prev) * 0.09);
        d += ` Q${((prev + x) / 2).toFixed(1)} ${(y + sag * 2).toFixed(1)} ${x.toFixed(1)} ${y}`; prev = x;
      });
      line.querySelector("path")!.setAttribute("d", d);
    };
    drawLine();
    window.addEventListener("resize", drawLine);
    window.addEventListener("load", drawLine);

    let swingers: ((v: number) => void)[] | null = null, swingT = 0;
    const swing = (v: number) => {
      if (reduce) return;
      swingers ??= cards.map((c) => gsap.quickTo(c, "rotation", { duration: 1.1, ease: "elastic.out(1, 0.35)" }) as (v: number) => void);
      const r = Math.max(-11, Math.min(11, -v / 140));
      swingers.forEach((q) => q(r));
      window.clearTimeout(swingT); swingT = window.setTimeout(() => swingers?.forEach((q) => q(0)), 90);
    };
    const markChapter = () => {
      const mid = window.innerWidth * (pinned() ? 0.55 : 0.5);
      let best: HTMLElement | null = null, bi = 0, bd = 1e9;
      cards.forEach((c, n) => { const r = c.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid); if (d < bd) { bd = d; best = c; bi = n; } });
      if (best) chips.forEach((b) => b.classList.toggle("is-on", b.dataset.ch === (best as HTMLElement).dataset.ch));
      if (clNow.textContent !== pad2(bi + 1)) clNow.textContent = pad2(bi + 1);
    };

    /* Phone swipe: cards swing with swipe speed */
    let last = 0, lastT = 0;
    const onSwipe = () => {
      if (pinned() || reduce) return;
      const now = performance.now(), dx = vp.scrollLeft - last, dt = Math.max(16, now - lastT); last = vp.scrollLeft; lastT = now;
      swing((dx / dt) * 1000);
      markChapter();
    };
    vp.addEventListener("scroll", onSwipe, { passive: true });

    const first = (slug: string) => track.querySelector<HTMLElement>(`.tcard[data-ch="${slug}"]`);
    const swipeTo = (slug: string) => { const f = first(slug); if (f) vp.scrollTo({ left: f.offsetLeft - 16, behavior: reduce ? "auto" : "smooth" }); };
    go.current = swipeTo;

    gsap.matchMedia().add(MM, (ctx) => {
      const { desk, motion } = ctx.conditions as { desk: boolean; motion: boolean };
      if (!motion || !desk || !cards.length) { site?.classList.remove("cl-pin"); return; }

      /* Pinned ribbon strip, with a category rail and a real progress bar */
      const clBar = sect.querySelector<HTMLElement>("#clBar")!, clTrk = sect.querySelector<HTMLElement>("#clTrk")!, clTrav = sect.querySelector<HTMLElement>("#clTrav")!;
      let clNodes: { el: HTMLElement; p: number }[] = [];
      const chapterTicks = () => {
        // one point per category, placed where that category starts
        clNodes.forEach((nd) => nd.el.remove()); clNodes = [];
        const d = Math.max(1, track.scrollWidth - window.innerWidth);
        // every position is read before the first point goes in, so the page is laid out once, not once a category
        const at = chapters.map((c, n) => {
          const f = first(c.slug);
          return f ? (n ? Math.min(1, Math.max(0, (f.offsetLeft - window.innerWidth * 0.3) / d)) : 0) : null;
        });
        at.forEach((p) => {
          if (p === null) return;
          const el = document.createElement("span"); el.className = "cl-node"; el.style.left = (p * 100).toFixed(2) + "%";
          clTrk.insertBefore(el, clTrav); clNodes.push({ el, p });
        });
      };
      const clProgress = (p: number) => {
        clBar.style.transform = `scaleX(${p.toFixed(4)})`;
        clTrav.style.left = (p * 100).toFixed(2) + "%";
        clNodes.forEach((nd) => nd.el.classList.toggle("is-done", p >= nd.p - 0.002));
      };
      site?.classList.add("cl-pin");
      drawLine();
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const hTween = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: sect, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.7, invalidateOnRefresh: true,
          onRefresh: (self) => { drawLine(); chapterTicks(); clProgress(self.progress); },
          onUpdate: (self) => { clProgress(self.progress); markChapter(); swing(self.getVelocity()); },
        },
      });
      /* Each photo and each category word drifts a little as the strip travels: a tween and a trigger apiece,
         thirty-odd in all. None of it shows until the strip is on screen, so it is set up in a quiet moment
         (or as the strip nears), not while the page is first coming alive. */
      const drift = ctx.add("drift", () => {
        gsap.utils.toArray<HTMLElement>(".ph img").forEach((img) => {
          gsap.fromTo(img, { xPercent: -7 }, { xPercent: 7, ease: "none", scrollTrigger: { trigger: img.closest(".tcard"), containerAnimation: hTween, start: "left right", end: "right left", scrub: true } });
        });
        gsap.utils.toArray<HTMLElement>(".ch-word").forEach((w) => {
          gsap.fromTo(w, { xPercent: 30, rotation: -2 }, { xPercent: -30, rotation: -9, ease: "none", scrollTrigger: { trigger: w, containerAnimation: hTween, start: "left right", end: "right left", scrub: true } });
        });
      });
      const stopDrift = soon(sect, () => drift());
      chapterTicks(); clProgress(0);
      gsap.from(".cl-chips li", { y: 30, opacity: 0, duration: 0.7, stagger: 0.06, ease: "expo.out", scrollTrigger: { trigger: sect, start: "top 70%", once: true } });

      go.current = (slug) => {
        const f = first(slug), st = hTween.scrollTrigger;
        if (!f || !st) return;
        const d = Math.max(1, track.scrollWidth - window.innerWidth);
        const off = Math.min(d, Math.max(0, f.offsetLeft - window.innerWidth * 0.3));
        glideTo(st.start + (st.end - st.start) * (off / d));
      };
      return () => {
        stopDrift();
        site?.classList.remove("cl-pin");
        clNodes.forEach((nd) => nd.el.remove());
        gsap.set(track, { x: 0 });
        go.current = swipeTo;
      };
    });

    /* the Shop menu in the header jumps to a shelf */
    let busT = 0;
    const off = homeBus.on("chapter", (slug) => {
      if (pinned()) { go.current(slug); return; }
      scrollToEl(sect);
      busT = window.setTimeout(() => go.current(slug), 900);
    });

    return () => {
      window.removeEventListener("resize", drawLine); window.removeEventListener("load", drawLine);
      vp.removeEventListener("scroll", onSwipe);
      window.clearTimeout(swingT); window.clearTimeout(busT);
      off();
      site?.classList.remove("cl-pin");
    };
  }, root);

  return (
    <section id="collection" aria-labelledby="cl-title" ref={root}>
      <div className="cl-head-m">
        <p className="eyebrow">Real boxes, real prices</p>
        <h2>Pegged up for you</h2>
      </div>
      <div className="cl-viewport" id="clViewport">
        <div className="cl-track" id="clTrack">
          <svg className="cl-line" id="clLine" aria-hidden="true"><path d="" /></svg>
          <div className="cl-head-d">
            <p className="eyebrow">Real boxes, real prices</p>
            <h2 id="cl-title">Pegged up for you</h2>
            <p>Every box here was packed and photographed by BOXTOP. Like one? Open it to order, or tweak it and make it yours.</p>
          </div>
          {chapters.map((c) => [
            <div key={`w-${c.slug}`} className="ch-word" aria-hidden="true">{c.name}</div>,
            ...boxes.filter((b) => b.chapter === c.slug).map((p, n) => (
              <article key={p.id} className="tcard" data-ch={c.slug} id={`box-${p.slug}`} style={{ rotate: `${n % 2 ? 1.5 : -1.5}deg` }}>
                <span className="peg" aria-hidden="true" />
                <Link className="pol" href={`/box/${p.slug}`}>
                  <div className="ph"><Pic src={p.img!} sources={boxSources(p.img)} sizes={PH_SIZES} alt={p.alt} loading="lazy" /></div>
                  <div className="cap"><h3>{p.name}</h3><p>{p.summary}</p></div>
                </Link>
                <span className="ptag">{p.price === null ? "Ask for price" : rs(p.price)}</span>
                <button className="tweak" type="button" onClick={() => homeBus.emit("preset", p.id)}>Tweak this box <span aria-hidden="true">→</span></button>
              </article>
            )),
          ])}
        </div>
      </div>
      <p className="swipe">Swipe for more boxes →</p>
      <div className="cl-rail" id="clRail">
        <ul className="cl-chips" id="clChips" aria-label="Jump to a category">
          {chapters.map((c, n) => (
            <li key={c.slug}><button type="button" data-ch={c.slug} className={n === 0 ? "is-on" : undefined} onClick={() => go.current(c.slug)}>{c.name}<i>{c.count}</i></button></li>
          ))}
        </ul>
        <div className="cl-prog" aria-hidden="true">
          <span className="cl-count"><b id="clNow">01</b>/ <span id="clAll">{pad2(boxes.length)}</span></span>
          <div className="cl-trk" id="clTrk">
            <div className="cl-rl"><i id="clBar" /></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="cl-trav" id="clTrav"><img src="/brand/logo-96.webp" alt="" width={36} height={36} /></span>
          </div>
        </div>
      </div>
    </section>
  );
}
