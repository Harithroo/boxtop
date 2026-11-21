"use client";
// The intro (a gift-wrapped lid that unties and lifts off, once per session) and the hero it reveals:
// real box photos taped up like prints, drifting with the pointer and scattering as you scroll away.
import Link from "next/link";
import { useRef } from "react";
import { preload } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { homeBus } from "@/lib/home-bus";
import { coarsePointer, lockScroll, reducedMotion, scrollToEl, scroller, siteEl } from "@/components/site/scroll";
import { useSiteTheme } from "@/components/SiteTheme";
import { boxSources, CAFE } from "@/lib/srcset";
import { Pic } from "@/components/Pic";
import { settle } from "./register";

export type HeroCard = { img: string; alt: string; caption: string; price: string | null; href: string | null };
type Props = { cards: [HeroCard, HeroCard, HeroCard]; proof: string; fromPrice: string | null; next: { name: string; when: string } | null };

const SEEN = "bt3-intro";
// Runs while the page is still being parsed, so a first-time visitor never sees the hero before the lid covers it.
const PREPAINT = `(function(){var s=document.getElementById('site');if(!s)return;var seen=null;try{seen=sessionStorage.getItem('${SEEN}')}catch(e){}var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;if(!seen&&!rm){s.classList.add('intro-on');document.documentElement.classList.add('bt-lock')}setTimeout(function(){if(!s.dataset.intro){s.classList.remove('intro-on');document.documentElement.classList.remove('bt-lock')}},9000)})()`;

// How wide a print's photo is drawn (home.css .fan/.hcard; the frame's padding is 18px). On phones the fan is
// min(520px, page minus gutters) wide and a print a share of it; on desktop a print is clamped to the viewport.
const NARROW = "(max-width: 899px) calc(min(520px, 90vw) * .34 - 18px), calc(clamp(150px, 15vw, 232px) - 18px)";
const WIDE = "(max-width: 899px) calc(min(520px, 90vw) * .52 - 18px), calc(clamp(210px, 23vw, 340px) - 18px)";

const MUG = {
  avif: "/home/birthday-mug-240.avif 240w, /home/birthday-mug-320.avif 320w, /home/birthday-mug.avif 598w",
  webp: "/home/birthday-mug-320.webp 320w, /home/birthday-mug.webp 598w",
};

function Photo({ c, cls, wide }: { c: HeroCard; cls: string; wide?: boolean }) {
  const inner = (
    <>
      <Pic src={c.img} sources={boxSources(c.img)} sizes={wide ? WIDE : NARROW} alt={c.alt} />
      <figcaption>{c.caption}{c.price && <b>{c.price}</b>}</figcaption>
    </>
  );
  return (
    <figure className={`hcard ${cls}${wide ? " wide" : ""}`}>
      <div className="card-p"><span className="tape" />{c.href ? <Link href={c.href} className="hcard-link">{inner}</Link> : inner}</div>
    </figure>
  );
}

// The photo "Boxed." is filled with (home.css .t-big). The word is the page's largest paint, and it counts as
// painted only once this photo is in, so the photo is asked for with the page, not when the stylesheet is read.
// Same file as the first candidate of .t-big's image-set().
const BIG = "/catalog/boxes/grand-red.avif";

export function Hero({ cards, proof, fromPrice, next }: Props) {
  preload(BIG, { as: "image", type: "image/avif", fetchPriority: "high" });
  const dark = useSiteTheme() === "dark";
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [proofLead, ...proofRest] = proof.split(" ");

  useGSAP((_, contextSafe) => {
    const site = siteEl();
    const reduce = reducedMotion();
    const el = root.current!;
    const num = el.querySelector<HTMLElement>("#introNum")!, bar = el.querySelector<HTMLElement>("#introBar")!;
    // the "scroll to unpack" pill bows out as soon as the visitor starts scrolling, and comes back at the very top
    const cue = el.querySelector<HTMLElement>(".scroll-cue");
    if (cue) ScrollTrigger.create({ trigger: el, start: "top+=40 top", onEnter: () => cue.classList.add("is-gone"), onLeaveBack: () => cue.classList.remove("is-gone") });
    // "Boxed." is filled with a slowly drifting photo (home.css .t-big, @keyframes drift). The browser cannot hand
    // that animation to the GPU, so every frame of it is repainted on the main thread, for as long as the page is open.
    const big = el.querySelector<HTMLElement>(".t-big");
    if (big) ScrollTrigger.create({
      trigger: big, start: "top bottom", end: "bottom top",
      onToggle: (self) => {
        // self.isActive: the word is on screen. Decide when the drift runs, through big.style.animationPlayState.
        // TODO(human)
      },
    });

    const heroIn = (fast: boolean) =>
      gsap.timeline()
        .from(".hero-title .line > span", { yPercent: 115, duration: fast ? 0.8 : 1.1, stagger: 0.1, ease: "expo.out" })
        .from(".hero-copy .eyebrow, .hero-lede, .hero-cta > *, .hero-facts > *", { y: 18, opacity: 0, duration: 0.6, stagger: 0.05, ease: "power2.out" }, 0.25)
        .from(".fan .hcard", { yPercent: 70, opacity: 0, duration: 1.2, stagger: 0.08, ease: "expo.out" }, 0.15)
        .from(".fan .tape", { scaleX: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }, 0.9);

    const endIntro = () => {
      site?.classList.remove("intro-on");
      try { sessionStorage.setItem(SEEN, "1"); } catch {}
      lockScroll(false);
      tl.current = null;
      // releasing the lock brings the scrollbar back where there is one, and the page gets that much narrower
      settle();
    };
    /* Untie, then lift the lid. */
    const playIntro = contextSafe!(() => {
      if (site) { site.classList.add("intro-on"); site.dataset.intro = "1"; }
      lockScroll(true);
      const c = { v: 0 };
      gsap.set(["#introLid", ".band i", ".intro-bow", ".bow-l", ".bow-r", "#introTag", ".intro-word span", ".intro-count", ".intro-skip"], { clearProps: "transform,opacity,visibility" });
      gsap.set("#intro", { autoAlpha: 1 });
      num.textContent = "000"; bar.style.setProperty("--p", "0");
      tl.current = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: endIntro })
        .from(".band-h i", { scaleX: 0, duration: 0.6, ease: "power3.inOut" }, 0)
        .from(".band-v i", { scaleY: 0, duration: 0.6, ease: "power3.inOut" }, 0.1)
        .from(".intro-bow", { scale: 0, rotation: -25, transformOrigin: "50% 60%", duration: 0.8, ease: "back.out(2.4)" }, 0.45)
        .from("#introTag", { y: -60, rotation: 28, autoAlpha: 0, duration: 1.3, ease: "elastic.out(1,.45)" }, 0.75)
        .from(".intro-word span", { yPercent: 110, duration: 0.55, stagger: 0.05 }, 0.95)
        .to(c, { v: 100, duration: 1.6, ease: "power2.inOut", onUpdate: () => { const v = Math.round(c.v); num.textContent = ("00" + v).slice(-3); bar.style.setProperty("--p", String(v / 100)); } }, 0.2)
        .to(".bow-l", { rotation: -35, x: -30, transformOrigin: "100% 100%", duration: 0.4, ease: "power2.in" }, 2.0)
        .to(".bow-r", { rotation: 35, x: 30, transformOrigin: "0% 100%", duration: 0.4, ease: "power2.in" }, 2.0)
        .to(".intro-bow", { scale: 0.2, autoAlpha: 0, duration: 0.35, ease: "power2.in" }, 2.2)
        .to("#introTag", { y: 120, rotation: -18, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, 2.1)
        .to(".band-h i:first-child", { xPercent: -102, duration: 0.5, ease: "power3.in" }, 2.2)
        .to(".band-h i:last-child", { xPercent: 102, duration: 0.5, ease: "power3.in" }, 2.2)
        .to(".band-v i:first-child", { yPercent: -102, duration: 0.5, ease: "power3.in" }, 2.25)
        .to(".band-v i:last-child", { yPercent: 102, duration: 0.5, ease: "power3.in" }, 2.25)
        .to(".intro-count, .intro-skip", { autoAlpha: 0, duration: 0.3 }, 2.2)
        .to("#introLid", { yPercent: -104, rotationX: 16, duration: 1.05, ease: "expo.inOut" }, 2.6)
        .add(heroIn(false), 2.95);
    });

    let seen: string | null = null;
    try { seen = sessionStorage.getItem(SEEN); } catch {}
    if (!seen && !reduce) playIntro();
    else {
      site?.classList.remove("intro-on");
      document.documentElement.classList.remove("bt-lock");
      if (!reduce) heroIn(true);
    }

    const skip = () => tl.current?.progress(1);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") skip(); };
    el.querySelector("#introSkip")?.addEventListener("click", skip);
    document.addEventListener("keydown", onKey);
    let replayT = 0;
    const offReplay = homeBus.on("replay", () => {
      if (reduce) return;
      window.scrollTo(0, 0); scroller.lenis?.scrollTo(0, { immediate: true, force: true });
      replayT = window.setTimeout(playIntro, 60);
    });

    /* Pointer parallax on the hero photos */
    let onMove: ((e: PointerEvent) => void) | null = null;
    const top = el.querySelector<HTMLElement>("#top")!;
    if (!coarsePointer() && !reduce) {
      const movers = gsap.utils.toArray<HTMLElement>(".fan .card-p").map((p, i) => ({
        x: gsap.quickTo(p, "x", { duration: 0.8, ease: "power3" }), y: gsap.quickTo(p, "y", { duration: 0.8, ease: "power3" }), d: [0.6, 1, 1.6, 0.9, 0.7][i] || 1,
      }));
      onMove = (e) => {
        const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        movers.forEach((m) => { m.x(nx * 34 * m.d); m.y(ny * 24 * m.d); });
      };
      top.addEventListener("pointermove", onMove);
    }

    /* The photos drift apart on the way out */
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(".fan .hcard", {
        y: (i) => [-90, -170, -40, -200, -110][i], x: (i) => [-60, -20, 0, 30, 70][i], ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
    });

    return () => {
      el.querySelector("#introSkip")?.removeEventListener("click", skip);
      document.removeEventListener("keydown", onKey);
      if (onMove) top.removeEventListener("pointermove", onMove);
      offReplay(); window.clearTimeout(replayT);
      tl.current = null;
      site?.classList.remove("intro-on");
      lockScroll(false);
    };
  }, { scope: root });

  const jump = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); scrollToEl(document.getElementById(id)); };

  return (
    <div ref={root}>
      <script type={typeof window === "undefined" ? "text/javascript" : "text/plain"} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: PREPAINT }} />
      <div id="intro" aria-hidden="true">
        <div className="lid" id="introLid">
          <span className="band band-h"><i /><i /></span>
          <span className="band band-v"><i /><i /></span>
          <svg className="intro-bow" viewBox="0 0 300 190" aria-hidden="true">
            <g fill={dark ? "#ff3d8b" : "#d5136f"}>
              <path className="bow-l" d="M150 112 C 112 66, 46 38, 30 76 C 16 110, 76 128, 150 112 Z" />
              <path className="bow-r" d="M150 112 C 188 66, 254 38, 270 76 C 284 110, 224 128, 150 112 Z" />
              <path className="bow-tl" d="M146 116 L 104 186 L 122 178 L 132 190 L 156 120 Z" />
              <path className="bow-tr" d="M154 116 L 196 186 L 178 178 L 168 190 L 144 120 Z" />
            </g>
            <g fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="3" strokeLinecap="round">
              <path d="M140 108 C 108 80, 66 64, 52 82" /><path d="M160 108 C 192 80, 234 64, 248 82" />
            </g>
            <rect className="bow-knot" x="134" y="98" width="32" height="28" rx="9" fill={dark ? "#c9145f" : "#b50f5e"} />
          </svg>
          <div className="intro-tag" id="introTag">
            <span className="string" />
            <div className="tagcard">
              <div className="intro-word">{"BOXTOP".split("").map((ch, i) => <span key={i}>{ch}</span>)}</div>
              <p className="intro-sub">taste for gift</p>
            </div>
          </div>
        </div>
        <div className="intro-count"><span>Untying</span><b id="introNum">000</b><i id="introBar" /></div>
        <button className="intro-skip" type="button" id="introSkip">Skip intro</button>
      </div>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Curated gift boxes · Sri Lanka</p>
          <h1 className="hero-title">
            <span className="line"><span className="t-sm">Happiness,</span></span>
            <span className="line"><span className="t-big">Boxed.</span></span>
            <span className="line"><span className="t-hand">taste for gift</span></span>
          </h1>
          <p className="hero-lede">Gift boxes packed with brands people love and small-maker finds, from crochet bunnies to sesame cookies. Swap anything inside to suit the person you&apos;re sending it to.</p>
          <div className="hero-cta">
            <a className="btn btn-ribbon" href="#build" onClick={jump("build")}>Build your box</a>
            <a className="btn btn-ghost" href="#collection" onClick={jump("collection")}>See real boxes</a>
          </div>
          <div className="hero-facts">
            {proof && <span><b>{proofLead}</b> {proofRest.join(" ")}</span>}
            {fromPrice && <span>Boxes from <b className="tnum">{fromPrice}</b></span>}
            {next && <span><span className="dot" aria-hidden="true">●</span> Next occasion: <b>{next.name}</b> · {next.when.toLowerCase()}</span>}
          </div>
        </div>
        <div className="fan" id="fan" role="group" aria-label="Real BOXTOP boxes, as posted on their pages">
          <Photo c={cards[0]} cls="c1" />
          <Photo c={cards[1]} cls="c2" />
          <figure className="hcard c3 wide">
            <div className="card-p"><span className="tape" />
              <Pic src="/home/cafe-treat.webp" sources={CAFE} sizes={WIDE} alt="Open navy BOXTOP box with Hope cookies, Soul cold brew, Dilmah iced tea, marshmallows, Ferrero Rocher, Richlife cheese spread, KitKat and Kinder Bueno" width={900} height={675} />
              <figcaption>The café box, unpacked below ↓</figcaption>
            </div>
          </figure>
          <Photo c={cards[2]} cls="c4" />
          <figure className="hcard c5">
            <div className="card-p"><span className="tape" />
              <Pic src="/home/birthday-mug.webp" sources={MUG} sizes={NARROW} alt="Navy box with a teddy holding an I love you heart, a Happy Birthday mug, Yardley spray, Toblerone and Ferrero Rocher" width={598} height={745} />
              <figcaption>Her birthday</figcaption>
            </div>
          </figure>
        </div>
        <a className="scroll-cue" href="#unbox" onClick={jump("unbox")}>
          <span className="mouse" aria-hidden="true"><i /></span><span>Scroll to unpack a real box</span>
          <svg className="cue-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
      </section>
    </div>
  );
}
