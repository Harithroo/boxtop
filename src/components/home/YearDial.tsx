"use client";
// The gifting year: a dial of 365 ticks that turns to the next occasions, counted down from today.
// On a desktop the section pins and scrolling steps through the occasions; the dial can be clicked anywhere.
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { rs } from "@/lib/format";
import { homeBus } from "@/lib/home-bus";
import type { HomeBox, HomeOccasion } from "@/lib/home-data";
import { MONTHS_SHORT, dayOfYear } from "@/lib/occasions";
import { glideTo, reducedMotion, scrollToEl, siteEl } from "@/components/site/scroll";
import { MM } from "./stickers";

const K = 360 / 365.25;
const M_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const M_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const rad = (day: number) => (day * K * Math.PI) / 180;
const px = (day: number, r: number) => (Math.sin(rad(day)) * r).toFixed(1);
const py = (day: number, r: number) => (-Math.cos(rad(day)) * r).toFixed(1);

export function YearDial({ occasions, boxes, today }: { occasions: HomeOccasion[]; boxes: HomeBox[]; today: string }) {
  const root = useRef<HTMLElement>(null);
  const jump = useRef<(n: number) => void>(() => {});
  const todayDoy = dayOfYear(today);
  const first = occasions[0];

  useGSAP(() => {
    const sect = root.current!, site = siteEl(), reduce = reducedMotion();
    const dial = sect.querySelector<SVGSVGElement>("#dial")!, rot = sect.querySelector<SVGGElement>("#dialRot")!;
    const cards = gsap.utils.toArray<HTMLElement>(".occ"), idx = gsap.utils.toArray<HTMLElement>("#occIndex button"), dots = gsap.utils.toArray<SVGGElement>(".occ-g");
    const yrName = sect.querySelector("#yrName")!, yrDays = sect.querySelector("#yrDays")!, yrUnit = sect.querySelector("#yrUnit")!;
    const N = occasions.length;
    let cur = -1;
    const dialAngle = (n: number) => -(todayDoy + occasions[n].days) * K;
    const setOcc = (n: number, instant?: boolean) => {
      if (n === cur || !occasions[n]) return;
      cur = n;
      const o = occasions[n], d = o.days;
      cards.forEach((c) => c.classList.toggle("is-on", Number(c.dataset.i) === n));
      idx.forEach((b) => b.classList.toggle("is-on", Number(b.dataset.oi) === n));
      dots.forEach((g) => g.classList.toggle("is-on", Number(g.dataset.i) === n));
      yrName.textContent = o.name;
      yrDays.textContent = d <= 1 ? (d === 0 ? "Today" : "1") : String(d);
      yrUnit.textContent = d === 0 ? "" : d === 1 ? "day to go" : "days to go";
      const ang = dialAngle(n);
      if (!reduce && !instant) gsap.to(rot, { rotation: ang, svgOrigin: "0 0", duration: 1, ease: "power3.inOut", overwrite: true });
      else gsap.set(rot, { rotation: ang, svgOrigin: "0 0" });
    };
    if (N) setOcc(0, true);
    jump.current = (n) => setOcc(n);
    // Hover names for the dots. Added here because React's server renderer lifts an SVG <title> out of place.
    const tips = dots.map((g) => {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "title");
      t.textContent = g.dataset.tip ?? "";
      g.prepend(t);
      return t;
    });

    const onClick = (e: MouseEvent) => {
      const g = (e.target as Element).closest<SVGGElement>(".occ-g");
      if (g) return jump.current(Number(g.dataset.i));
      if (!N) return;
      const pt = dial.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(dial.getScreenCTM()!.inverse());
      if (Math.sqrt(p.x * p.x + p.y * p.y) < 120) return jump.current((cur + 1) % N);
      const ang = (Math.atan2(p.x, -p.y) * 180) / Math.PI;
      const curRot = Number(gsap.getProperty(rot, "rotation")) || 0;
      const day = ((((ang - curRot) % 360) + 360) % 360) / K;
      let best = 0, bd = 1e9;
      occasions.forEach((o, n) => { let d = Math.abs(dayOfYear(o.date) - day); d = Math.min(d, 365 - d); if (d < bd) { bd = d; best = n; } });
      jump.current(best);
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (!N) return;
      if (k === "ArrowRight" || k === "ArrowDown") { e.preventDefault(); jump.current((cur + 1) % N); }
      if (k === "ArrowLeft" || k === "ArrowUp") { e.preventDefault(); jump.current((cur - 1 + N) % N); }
      if (k === "Home") { e.preventDefault(); jump.current(0); }
      if (k === "End") { e.preventDefault(); jump.current(N - 1); }
    };
    dial.addEventListener("click", onClick);
    dial.addEventListener("keydown", onKey);

    gsap.matchMedia().add(MM, (ctx) => {
      const { desk, motion } = ctx.conditions as { desk: boolean; motion: boolean };
      if (!motion) { site?.classList.remove("yr-pin"); return; }
      let yrT = 0;
      if (desk && N) {
        /* pinned: scrolling steps through the occasions; clicks scroll to them */
        site?.classList.add("yr-pin");
        let lock = false;
        const st = ScrollTrigger.create({
          trigger: sect, start: "top top", end: () => "+=" + Math.round(window.innerHeight * 0.55 * N), pin: true, invalidateOnRefresh: true,
          onUpdate: (self) => { if (!lock) setOcc(Math.min(N - 1, Math.floor(self.progress * N * 0.999))); },
        });
        jump.current = (n) => {
          /* turn the dial now, then scroll to where that occasion lives without flicking through the ones between */
          setOcc(n);
          const y = st.start + (st.end - st.start) * ((n + 0.5) / N);
          lock = true; window.clearTimeout(yrT);
          const unlock = () => { lock = false; };
          glideTo(y, unlock);
          yrT = window.setTimeout(unlock, 2800);
        };
      }
      gsap.from(dial, { rotation: -40, opacity: 0, scale: 0.9, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: sect, start: "top 70%", once: true } });
      return () => { site?.classList.remove("yr-pin"); window.clearTimeout(yrT); jump.current = (n) => setOcc(n); };
    });

    /* the Occasions menu in the header turns the dial */
    const off = homeBus.on("occ", (slug) => {
      const n = occasions.findIndex((o) => o.slug === slug);
      if (n < 0) return;
      jump.current(n);
      if (!site?.classList.contains("yr-pin")) scrollToEl(sect);
    });
    return () => { dial.removeEventListener("click", onClick); dial.removeEventListener("keydown", onKey); off(); site?.classList.remove("yr-pin"); tips.forEach((t) => t.remove()); };
  }, { scope: root });

  const buildFor = (o: HomeOccasion) => { homeBus.emit("occasion", o.short); scrollToEl(document.getElementById("build")); };

  return (
    <section id="year" aria-labelledby="yr-title" ref={root}>
      <div className="yr-inner">
        <div className="yr-dialwrap">
          <svg id="dial" viewBox="-300 -300 600 600" role="group" tabIndex={0} aria-label="Year dial. Click an occasion, or use the arrow keys to move between them.">
            <circle className="dring outer" r="252" /><circle className="dring" r="214" />
            <g id="dialRot">
              <circle className="dring hit" r="232" />
              {Array.from({ length: 365 }, (_, d) => {
                const m = M_START.includes(d), r1 = m ? 222 : 236;
                return <line key={d} className={m ? "tick m" : "tick"} x1={px(d, r1)} y1={py(d, r1)} x2={px(d, 248)} y2={py(d, 248)} />;
              })}
              {M_NAMES.map((n, m) => (
                <text key={n} className="mon" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${((M_START[m] + 15) * K).toFixed(1)}) translate(0 -274)`}>{n}</text>
              ))}
              {occasions.map((o, n) => {
                const d = dayOfYear(o.date);
                return (
                  <g key={o.id} className={n === 0 ? "occ-g is-on" : "occ-g"} data-i={n} data-tip={`${o.name} · ${o.dateText}`} transform={`translate(${px(d, 232)} ${py(d, 232)})`}>
                    <circle className="occ-hit" r="26" /><circle className="occ-ring" r="12" /><circle className="occ-dot" r="9" />
                  </g>
                );
              })}
              <circle className="today" r="5" cx={px(todayDoy, 200)} cy={py(todayDoy, 200)} />
            </g>
            <path className="pointer" d="M0 -258 L-11 -290 L11 -290 Z" />
          </svg>
          <div className="yr-center" aria-live="polite">
            <i id="yrName">{first?.name ?? ""}</i>
            <b id="yrDays">{first ? (first.days <= 1 ? (first.days === 0 ? "Today" : "1") : first.days) : ""}</b>
            <span id="yrUnit">{first ? (first.days === 0 ? "" : first.days === 1 ? "day to go" : "days to go") : ""}</span>
          </div>
          <p className="yr-tip">Tap a dot on the dial</p>
        </div>
        <div className="yr-copy">
          <p className="eyebrow">The gifting year</p>
          <h2 id="yr-title">Never miss the next one</h2>
          <p>Sri Lanka&apos;s calendar is full of reasons to send a box. Here is what&apos;s coming, counted from today.</p>
          <ol className="occs" id="occs">
            {occasions.map((o, n) => {
              const p = boxes.find((b) => b.id === o.boxId);
              return (
                <li key={o.id} className={n === 0 ? "occ is-on" : "occ"} data-i={n}>
                  <figure className="occ-ph">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {o.img && <img src={o.img} alt="" loading="lazy" />}
                    <span className="occ-date"><b>{Number(o.date.slice(8))}</b><span>{MONTHS_SHORT[Number(o.date.slice(5, 7)) - 1]}</span></span>
                    <span className="occ-cd">{o.days === 0 ? <><b>Today</b><span>it&apos;s on</span></> : <><b>{o.days}</b><span>{o.days === 1 ? "day to go" : "days to go"}</span></>}</span>
                  </figure>
                  <div className="occ-body">
                    <h3>{o.name}</h3>
                    <p className="when">{o.dateText} · {o.when}</p>
                    <p>{o.idea}</p>
                    {p && (
                      <div className="occ-sug">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.img && <img src={p.img} alt="" loading="lazy" />}
                        <div><small>We&apos;d start from</small><b>{p.name}<span>{p.price === null ? "Ask for price" : rs(p.price)}</span></b></div>
                      </div>
                    )}
                    <div className="occ-cta">
                      <button className="btn btn-ribbon" type="button" onClick={() => buildFor(o)}>Build a box for {o.short}</button>
                      {p && <button className="btn btn-ghost" type="button" onClick={() => homeBus.emit("preset", p.id)}>Start from this box</button>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <ul className="occ-index" id="occIndex">
            {occasions.map((o, n) => (
              <li key={o.id}>
                <button type="button" data-oi={n} title={`${o.name} · ${o.dateText}`} className={n === 0 ? "is-on" : undefined} onClick={() => jump.current(n)}>
                  <i>{Number(o.date.slice(8))}</i><span>{o.short}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
