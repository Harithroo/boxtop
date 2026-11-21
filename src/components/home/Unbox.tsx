"use client";
// One real box, sticker by sticker. Nine cut-outs sit exactly over the photo they were cut from; scrolling pins the
// section, lifts them out in three groups, then packs them back. The photo itself flies in from the hero collage.
import { useRef } from "react";
import gsap from "gsap";
import { useGSAPLater } from "./register";
import { GROUPS, MM, STK, type Sticker } from "./stickers";
import { useSiteTheme } from "@/components/SiteTheme";
import { Pic } from "@/components/Pic";
import { CAFE, cutSources } from "@/lib/srcset";

// How wide the stage is drawn (home.css .ub-stage): the page minus gutters on phones; on desktop the column beside
// the copy, at most 760px and short enough to fit the screen height. The cut-outs scale with it, so they share it.
const STAGE = "(max-width: 899px) 90vw, min(760px, calc(86vw - 370px), calc((100vh - 270px) * 1.3333))";

export function Unbox() {
  const dark = useSiteTheme() === "dark";
  const root = useRef<HTMLElement>(null);

  useGSAPLater(() => {
    const sect = root.current!;
    const stage = sect.querySelector<HTMLElement>("#ubStage")!;
    const steps = gsap.utils.toArray<HTMLElement>(".step");
    let curStep = -1;
    const setStep = (n: number) => {
      if (curStep === n) return;
      curStep = n;
      steps.forEach((s) => s.classList.toggle("is-on", Number(s.dataset.step) === n));
    };
    setStep(0);

    gsap.matchMedia().add(MM, (ctx) => {
      const { desk, motion } = ctx.conditions as { desk: boolean; motion: boolean };
      if (!motion) { steps.forEach((s) => s.classList.add("is-on")); return; }

      /* The café box photo lifts out of the hero fan and settles into the stage */
      const heroCard = document.querySelector<HTMLElement>(".fan .c3"), heroImg = document.querySelector<HTMLImageElement>(".fan .c3 img");
      const copy = sect.querySelector<HTMLElement>(".ub-copy")!, ubBar = sect.querySelector<HTMLElement>("#ubBar")!;
      let flyImg: HTMLImageElement | null = null;
      let flyTick: (() => void) | null = null;
      if (heroCard && heroImg) {
        const fly = (flyImg = document.createElement("img"));
        // the copy the stage picked, not the small one in the hero print: it lands at the size of the stage
        const ubImg = stage.querySelector<HTMLImageElement>(".ub-photo");
        fly.className = "hero-fly"; fly.src = ubImg?.currentSrc || ubImg?.src || heroImg.src; fly.alt = "";
        document.body.appendChild(fly);
        const fp = { p: 0 }, ease = gsap.parseEase("power2.inOut");
        let flyState = 0;
        gsap.to(fp, { p: 1, ease: "none", scrollTrigger: { trigger: sect, start: "top bottom", end: "top top", scrub: 1.2 } });
        flyTick = () => {
          const p = fp.p, st = p <= 0.001 ? 0 : p >= 0.999 ? 2 : 1;
          if (st !== flyState) {
            flyState = st;
            heroCard.style.opacity = st === 0 ? "" : "0";
            stage.style.opacity = st === 2 ? "" : "0";
            fly.style.visibility = st === 1 ? "visible" : "hidden";
          }
          if (st !== 1) return;
          const a = heroImg.getBoundingClientRect(), b = stage.getBoundingClientRect(), e = ease(p);
          const w = a.width + (b.width - a.width) * e, x = a.left + (b.left - a.left) * e, y = a.top + (b.top - a.top) * e - Math.sin(Math.PI * e) * 40;
          const r = 2 * (1 - e) - 5 * Math.sin(Math.PI * e);
          fly.style.width = b.width + "px"; fly.style.height = b.height + "px";
          fly.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${r.toFixed(2)}deg) scale(${(w / b.width).toFixed(4)})`;
          fly.style.boxShadow = dark
            ? `0 0 0 ${((6 * b.width) / w).toFixed(1)}px #f6efe6,0 ${(40 + 40 * Math.sin(Math.PI * e)).toFixed(0)}px 90px -30px rgba(0,0,0,.85)`
            : `0 0 0 ${((6 * b.width) / w).toFixed(1)}px #fffdf7,0 ${(30 + 30 * Math.sin(Math.PI * e)).toFixed(0)}px 70px -30px rgba(59,46,34,.6)`;
        };
        gsap.ticker.add(flyTick);
      }

      /* How far a sticker may travel before it would leave the screen or cover the copy */
      const f = desk ? 1 : 0.58;
      const measure = () => {
        const inner = stage.offsetParent as HTMLElement, sr = sect.getBoundingClientRect();
        const W = stage.offsetWidth, H = stage.offsetHeight;
        const top = inner.offsetTop + stage.offsetTop, left = sr.left + inner.offsetLeft + stage.offsetLeft;
        return {
          W, H,
          l: desk ? Math.max(0, left - copy.getBoundingClientRect().right - 18) : 6,
          r: Math.max(0, window.innerWidth - left - W - (desk ? 28 : 6)),
          t: Math.max(0, top - (desk ? 78 : 70)),
          b: Math.max(0, sect.offsetHeight - top - H - (desk ? 56 : 190)),
        };
      };
      // Every sticker asks for the room twice (x and y), and nothing here moves between two refreshes: measure
      // once per refresh instead of eighteen times, each of which made the browser lay the page out again.
      let fits: ReturnType<typeof measure> | null = null;
      const room = () => (fits ??= measure());
      const goX = (s: Sticker) => {
        const R = room(), cx = (s.cx / 900) * R.W, hw = ((s.w / 100) * R.W * s.s) / 2;
        let t = cx + ((s.tx - s.cx) / 900) * R.W * f;
        t = Math.min(Math.max(t, -R.l + hw), R.W + R.r - hw);
        return t - cx;
      };
      const goY = (s: Sticker) => {
        const R = room(), cy = (s.cy / 675) * R.H, hh = ((s.h / 100) * R.H * s.s) / 2;
        let t = cy + ((s.ty - s.cy) / 675) * R.H * f;
        t = Math.min(Math.max(t, -R.t + hh), R.H + R.b - hh);
        return t - cy;
      };

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: sect, start: "top top", end: () => "+=" + Math.round(window.innerHeight * 3.2),
          pin: true, scrub: 0.8, invalidateOnRefresh: true,
          onRefreshInit: () => { fits = null; },
          onUpdate: (self) => {
            const p = self.progress;
            ubBar.style.transform = `scaleX(${p})`;
            setStep(p < 0.16 ? 0 : p < 0.42 ? 1 : p < 0.74 ? 2 : 3);
          },
        },
      });
      const counters = [0, 0, 0];
      tl.to("#ubVeil", { opacity: 0.82, duration: 0.12 }, 0.04);
      STK.forEach((s, n) => {
        const el = stage.querySelector<HTMLElement>(`.st[data-k="${s.k}"]`)!;
        const rt = el.querySelector(".st-rot"), plain = el.querySelector(".st-plain"), shot = el.querySelector(".st-s"), lbl = el.querySelector(".st-lbl");
        const at = GROUPS[s.g].at + counters[s.g]++ * GROUPS[s.g].stg;
        tl.to(el, { x: () => goX(s), y: () => goY(s), duration: 0.12 }, at)
          .to(rt, { rotation: s.r, scale: s.s, duration: 0.12 }, at)
          .to(shot, { opacity: 1, duration: 0.03, ease: "none" }, at)
          .to(plain, { opacity: 0, duration: 0.03, ease: "none" }, at)
          .fromTo(lbl, { opacity: 0 }, { opacity: 1, duration: 0.05, immediateRender: false }, at + 0.07);
        const back = 0.82 + n * 0.007;
        tl.to(lbl, { opacity: 0, duration: 0.03 }, 0.79)
          .to(el, { x: 0, y: 0, duration: 0.12, ease: "power2.inOut" }, back)
          .to(rt, { rotation: 0, scale: 1, duration: 0.12, ease: "power2.inOut" }, back)
          .to(shot, { opacity: 0, duration: 0.03, ease: "none" }, back + 0.1)
          .to(plain, { opacity: 1, duration: 0.03, ease: "none" }, back + 0.1);
      });
      tl.to("#ubVeil", { opacity: 0, duration: 0.1 }, 0.86).to({}, { duration: 0.001 }, 1);

      return () => {
        if (flyTick) gsap.ticker.remove(flyTick);
        flyImg?.remove();
        if (heroCard) heroCard.style.opacity = "";
        stage.style.opacity = "";
      };
    });
  }, root);

  return (
    <section id="unbox" aria-labelledby="ub-title" ref={root}>
      <div className="ub-inner">
        <div className="ub-copy">
          <p className="eyebrow">One real box · the café box</p>
          <h2 id="ub-title">Unpack a real box</h2>
          <p className="sub">Every sticker here was cut from a single BOXTOP photo. Keep scrolling and the box empties itself, then packs back up.</p>
          <ol className="steps">
            <li className="step" data-step="0"><span className="num">01</span><div><b>The box</b><p>Navy lid, kraft inside, our sticker on top.</p></div></li>
            <li className="step" data-step="1"><span className="num">02</span><div><b>Made in Sri Lanka</b><p>Hope cookies from CBL&apos;s Sahan Sevana bakers, Soul cold brew, Dilmah iced tea and Richlife cheese spread.</p></div></li>
            <li className="step" data-step="2"><span className="num">03</span><div><b>Everyone&apos;s favourites</b><p>Ferrero Rocher, Kinder Bueno, KitKat and marshmallows: the ones that go first.</p></div></li>
            <li className="step" data-step="3"><span className="num">04</span><div><b>Back in, lid on</b><p>Anything here can be swapped before it&apos;s packed.</p></div></li>
          </ol>
        </div>
        <div className="ub-stagewrap">
          <div className="ub-stage" id="ubStage">
            {/* lazy: the stage starts a screen below the top, so its nineteen pictures are still fetched as the page
                loads, but only once it is laid out, and not ahead of the stylesheets and scripts the hero waits on */}
            <Pic className="ub-photo" src="/home/cafe-treat.webp" sources={CAFE} sizes={STAGE} alt="An open BOXTOP gift box filled with snacks and drinks" width={900} height={675} loading="lazy" />
            <div className="ub-veil" id="ubVeil" />
            {STK.map((s) => (
              <div key={s.k} className="st" data-k={s.k} style={{ left: `${s.l}%`, top: `${s.t}%`, width: `${s.w}%`, height: `${s.h}%`, zIndex: s.g + 2 }}>
                <div className="st-rot">
                  <Pic className="st-plain" src={`/home/cut/${s.k}.webp`} sources={cutSources(s.k)} sizes={STAGE} alt="" loading="lazy" />
                  <Pic className="st-s" src={`/home/cut/${s.k}-s.webp`} sources={cutSources(`${s.k}-s`)} sizes={STAGE} alt="" loading="lazy" style={{ left: `${s.bl}%`, top: `${s.bt}%`, width: `${s.bw}%`, height: `${s.bh}%` }} />
                </div>
                <div className={`st-lbl side-${s.side}`}>{s.local && <span className="mk" title="Made in Sri Lanka">LK</span>}{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="ub-hint">Scroll</p>
      <div className="ub-bar"><i id="ubBar" /></div>
      <ul className="ub-list" aria-label="What's inside the box">
        {STK.map((s) => <li key={s.k}><b>{s.name}</b>{s.note}{s.local ? " Made in Sri Lanka." : ""}</li>)}
      </ul>
    </section>
  );
}
