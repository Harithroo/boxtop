"use client";
// Ordering from abroad: pick where you are, watch the box fly home on a dotted globe lit by the real sun,
// and see your time against Colombo's. The boarding pass becomes a WhatsApp message.
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { WaIcon } from "@/components/site/icons";
import { reducedMotion } from "@/components/site/scroll";
import { CITIES, ORIGINS, clockIn, flightNo, gapText, nightAtHome } from "./cities";
import { useSiteTheme } from "@/components/SiteTheme";

const FL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const BARS = [[2, 2.4], [5.6, 3.2], [11.4, 1.2], [13.8, 1.2], [16.8, 1.2], [20.6, 1.6], [23.4, 1.2], [26.4, 3.2], [30.8, 1.6], [33.6, 3.2], [38, 1.2], [40.4, 1.2], [44.2, 3.2], [48.6, 1.6], [51.4, 1.6], [54.8, 3.2], [59.2, 1.2], [63, 2.4], [68, 1.6], [70.8, 1.6], [74.2, 1.2], [78, 1.2], [81.8, 1.2], [85.6, 1.6], [89, 3.2], [94, 3.2], [99.8, 3.2], [104.8, 2.4]];
const PLANE_D = "M-18 -2.6 L13 -2.6 C19 -2.6 23 -1.2 23 0 C23 1.2 19 2.6 13 2.6 L-18 2.6 C-20 2.6 -21 1.4 -21 0 C-21 -1.4 -20 -2.6 -18 -2.6 Z M4 -2.4 L-5 -18 L-9.5 -18 L-5.5 -2.4 Z M4 2.4 L-5 18 L-9.5 18 L-5.5 2.4 Z M-13 -2.2 L-18 -9 L-21 -9 L-18.5 -2.2 Z M-13 2.2 L-18 9 L-21 9 L-18.5 2.2 Z";
const START = "DXB";

export function Abroad({ wa }: { wa: string }) {
  const theme = useSiteTheme(), dark = theme === "dark";
  const root = useRef<HTMLElement>(null);
  const [code, setCode] = useState(START);
  const [times, setTimes] = useState({ you: "--:--", home: "--:--", gap: "", night: "live" });
  const cur = useRef(START);
  const auto = useRef(true);
  const globe = useRef<{ route: (c: string) => void; destroy: () => void } | null>(null);
  const city = CITIES[code];

  /** The split-flap flicker of a departures board, on elements React leaves alone. */
  const flap = (sel: string, txt: string) => {
    const el = root.current?.querySelector<HTMLElement & { _t?: number }>(sel);
    if (!el || el.textContent === txt) return;
    if (reducedMotion()) { el.textContent = txt; return; }
    let n = 0; window.clearInterval(el._t);
    el._t = window.setInterval(() => {
      if (n++ >= 7) { window.clearInterval(el._t); el.textContent = txt; return; }
      let s = ""; for (let i = 0; i < txt.length; i++) s += txt[i] === " " ? " " : FL[Math.floor(Math.random() * FL.length)];
      el.textContent = s; el.classList.remove("go"); void el.offsetWidth; el.classList.add("go");
    }, 50);
  };
  const tick = () => {
    const d = new Date(), c = CITIES[cur.current];
    setTimes({ you: clockIn(c.tz, d), home: clockIn("Asia/Colombo", d), gap: gapText(cur.current, d), night: nightAtHome(d) ? "it's night at home" : "it's daytime at home" });
    flap("#psFromT", clockIn(c.tz, d));
  };
  const pick = (next: string, user: boolean) => {
    if (!CITIES[next]) return;
    if (user) auto.current = false;
    cur.current = next;
    setCode(next);
    flap("#psFrom", next); flap("#psFlight", flightNo(next));
    tick();
    globe.current?.route(next);
  };
  const pickRef = useRef(pick);
  useEffect(() => { pickRef.current = pick; });

  useEffect(() => {
    const el = root.current!;
    let dead = false;
    // the globe and its land dots arrive only when the section is near
    const io = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      import("./globe").then((m) => {
        if (dead) return;
        globe.current = m.createGlobe({
          wrap: el.querySelector<HTMLElement>("#glWrap")!, canvas: el.querySelector<HTMLCanvasElement>("#glCanvas")!,
          pins: Array.from(el.querySelectorAll<HTMLElement>(".gp")), reduce: reducedMotion(),
          current: () => cur.current, touring: () => auto.current, onTour: (next) => pickRef.current(next, false), theme,
        });
        globe.current.route(cur.current);
      });
    }, { rootMargin: "600px" });
    io.observe(el);
    tick();
    const id = window.setInterval(tick, 30000);
    return () => { dead = true; io.disconnect(); window.clearInterval(id); globe.current?.destroy(); globe.current = null; };
    // tick and flap only touch refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useGSAP(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      // All four start states go on first and the triggers are made after: a trigger measures the page as it is
      // created, and a measurement between two changes makes the browser lay the page out again each time.
      const reveals: [gsap.core.Tween, string, string][] = [
        [gsap.from(".ab-globe", { y: 60, opacity: 0, duration: 1, ease: "expo.out", paused: true }), ".ab-stage", "top 85%"],
        [gsap.from(".pass", { y: 80, rotation: 4, opacity: 0, duration: 1.1, delay: 0.15, ease: "expo.out", paused: true }), ".ab-stage", "top 85%"],
        [gsap.from(".cities li", { y: 20, opacity: 0, duration: 0.5, stagger: 0.04, ease: "power2.out", paused: true }), ".ab-pick", "top 90%"],
        [gsap.from(".ab-steps li", { y: 30, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power3.out", paused: true }), ".ab-steps", "top 90%"],
      ];
      reveals.forEach(([animation, trigger, start]) => ScrollTrigger.create({ animation, trigger, start, once: true }));
    });
  }, { scope: root });

  const msg = `Hi BOXTOP! I'm in ${city.n} and I'd like to send a gift box to someone in Sri Lanka. Could you help me pick one and confirm the delivery day?`;
  const ic = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

  return (
    <section id="abroad" aria-labelledby="ab-title" ref={root}>
      <div className="ab-head">
        <div>
          <p className="eyebrow">Ordering from abroad</p>
          <h2 id="ab-title">Send a box <em>home</em></h2>
          <p>Working in Dubai or studying in Melbourne? You can still be the one who turns up with a gift. Pick where you are, and watch your box fly home.</p>
        </div>
        <div className="ab-stat"><b>USD 8.07bn</b><span>sent home by Sri Lankans working abroad in 2025, the most on record (Central Bank of Sri Lanka).</span></div>
      </div>
      <div className="ab-pick">
        <span>Flying from</span>
        <ul className="cities" aria-label="Where you are">
          {ORIGINS.map((k) => (
            <li key={k}><button type="button" aria-pressed={k === code} className={k === code ? "is-on" : undefined} onClick={() => pick(k, true)}><b>{k}</b>{CITIES[k].n}</button></li>
          ))}
        </ul>
      </div>
      <div className="ab-stage">
        <div className="ab-globe">
          <div className="gl-wrap" id="glWrap" role="img" aria-label={`Globe showing the route from ${city.n} to Colombo. ${times.gap}${times.gap ? "." : ""}`}>
            <canvas id="glCanvas" aria-hidden="true" />
            <div className="gl-pins">
              {ORIGINS.map((k) => (
                <button key={k} type="button" className="gp" data-c={k} aria-label={`Fly from ${CITIES[k].n}`} onClick={() => pick(k, true)}>{k}<span className="lb">{CITIES[k].n}</span></button>
              ))}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <button type="button" className="gp home" data-c="CMB" aria-label="Colombo, home" tabIndex={-1}><img src="/brand/logo-96.webp" alt="" /><span className="lb">Home · Colombo</span></button>
            </div>
          </div>
          <p className="gl-hint">Drag to spin · tap a city to fly from it</p>
          <div className="ab-legend">
            <span className="lg-night"><i />Night right now · <b>{times.night}</b></span>
            <span>Your time <b>{times.you}{times.you !== "--:--" ? ` ${city.n}` : ""}</b></span>
            <span>Home time <b>{times.home}{times.home !== "--:--" ? " Colombo" : ""}</b></span>
          </div>
        </div>
        <article className="pass" aria-live="polite">
          <div className="pass-main">
            <div className="pass-top">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <span className="pass-brand"><img src="/brand/logo-96.webp" alt="" width={30} height={30} />BOXTOP AIR</span>
              <span className="pass-class">Gift class</span>
            </div>
            <div className="pass-route">
              <div className="pass-end"><small>From</small><b className="flap" id="psFrom">{START}</b><span>{city.n}</span><em id="psFromT">--:--</em></div>
              <div className="pass-fly"><svg viewBox="-24 -20 48 40" aria-hidden="true"><path d={PLANE_D} fill="currentColor" /></svg><i /><small>{times.gap}</small></div>
              <div className="pass-end to"><small>To</small><b>CMB</b><span>Colombo</span><em>{times.home}</em></div>
            </div>
            <div className="pass-grid">
              <div><small>Passenger</small><b>One gift box</b></div>
              <div><small>Flight</small><b className="flap" id="psFlight">{flightNo(START)}</b></div>
              <div><small>Seat</small><b>Front door</b></div>
              <div><small>Gate</small><b>WhatsApp</b></div>
              <div><small>Payment</small><b>Bank transfer</b></div>
              <div><small>Lands</small><b>Day we confirm</b></div>
            </div>
          </div>
          <div className="pass-stub">
            <svg className="barcode" viewBox="0 0 110 46" aria-hidden="true">{BARS.map(([x, w]) => <rect key={x} x={x} y="0" width={w} height="46" fill={dark ? "#24152f" : "#3b2e22"} />)}</svg>
            <a className="btn btn-ribbon" href={wa ? `https://wa.me/${wa}?text=${encodeURIComponent(msg)}` : "/contact"} target="_blank" rel="noopener"><WaIcon />Book this flight</a>
          </div>
        </article>
      </div>
      <ol className="ab-steps">
        <li><span className="ic"><svg {...ic}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z" /><path d="M8.5 10.5h7M8.5 13.5h4" /></svg></span><div><b>Message us from {city.n}</b><p>WhatsApp works on any network. Send the address in Sri Lanka and who it&apos;s for.</p></div></li>
        <li><span className="ic"><svg {...ic}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" /></svg></span><div><b>Pay by bank transfer</b><p>From wherever your bank is. Send us a photo of the slip. We deliver within Sri Lanka only.</p></div></li>
        <li><span className="ic"><svg {...ic}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg></span><div><b>We deliver on home time</b><p>We confirm the delivery day in Sri Lanka time, so you can call right as it lands.</p></div></li>
      </ol>
    </section>
  );
}
