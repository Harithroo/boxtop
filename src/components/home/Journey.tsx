"use client";
// Ordering and delivery: a pinned, full-screen story through the five order states the back office uses
// (pending, confirmed, packed, dispatched, delivered), one animated scene per state, then the order itself.
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { scrollToEl } from "@/components/site/scroll";
import { SCENE_DOOR, SCENE_MESSAGE, SCENE_PAY, SCENE_VAN } from "./scenes";
import { MM, STK } from "./stickers";

type Props = {
  wa: string; waDisplay: string; instagram: string; igHandle: string; facebook: string; hours: string; payLine: string;
  proof: string; areas: string[]; quotes: { text: string; by: string }[];
};

const JBG = ["#150c24", "#1c0f30", "#120a20", "#1a0e2e", "#210f2c"];
const listOf = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

export function Journey({ wa, waDisplay, instagram, igHandle, facebook, hours, payLine, proof, areas, quotes }: Props) {
  const root = useRef<HTMLElement>(null);
  const waHref = wa ? `https://wa.me/${wa}` : "/contact";
  const near = areas.slice(0, 3);
  const [lead, ...notes] = quotes;

  useGSAP(() => {
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
      const SC = [scene1(), scene2(), scene3(), scene4(), scene5()];
      gsap.set(jSteps, { autoAlpha: 0 });
      const goJ = (n: number, dir: number) => {
        if (n === jCur) return;
        const prev = jCur; jCur = n;
        jSteps.forEach((st, k) => st.classList.toggle("is-active", k === n));
        if (prev > -1) { gsap.to(jSteps[prev], { autoAlpha: 0, y: -60 * dir, duration: 0.45, ease: "power2.in", overwrite: true }); SC[prev].pause(); }
        gsap.fromTo(jSteps[n], { autoAlpha: 0, y: 70 * dir }, { autoAlpha: 1, y: 0, duration: 0.75, delay: prev > -1 ? 0.2 : 0, ease: "power3.out", overwrite: true });
        gsap.fromTo(qa(".jr-text > *", jSteps[n]), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, delay: prev > -1 ? 0.3 : 0.1, ease: "power3.out", overwrite: true });
        gsap.to(journey, { backgroundColor: JBG[n], duration: 0.8, ease: "power1.out" });
        SC[n].restart();
      };
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

      /* the order itself */
      gsap.from(".rv", { clipPath: "inset(0 0 100% 0)", duration: 0.9, stagger: 0.15, ease: "power3.out", scrollTrigger: { trigger: ".reviews", start: "top 88%", once: true } });
      gsap.from(".or-side .fact", { y: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ".or-final", start: "top 80%", once: true } });
    });
  }, { scope: root });

  const step = (n: number, status: string, title: string, text: string, meta: string, scene: React.ReactNode) => (
    <article className="jr-step" data-i={n}>
      <div className="jr-text">
        <span className="jr-num">0{n + 1}<small>/ 05</small></span>
        <span className="status">{status}</span>
        <h3>{title}</h3>
        <p>{text}</p>
        <span className="jr-meta">{meta}</span>
      </div>
      {scene}
    </article>
  );
  const drawn = (svg: string) => <div className="jr-scene" dangerouslySetInnerHTML={{ __html: svg.replaceAll("{{wa}}", waDisplay || "WhatsApp") }} />;

  return (
    <section id="order" aria-labelledby="dr-title" ref={root}>
      <div className="dr-head">
        <div>
          <p className="eyebrow">Ordering and delivery</p>
          <h2 id="dr-title">From our table to <em>their doorstep</em></h2>
        </div>
        {lead && <blockquote>&ldquo;{lead.text}&rdquo;<cite>{lead.by}</cite></blockquote>}
      </div>

      <div className="journey" id="journey">
        {step(0, "Pending", "Message us", "Pick a box from this page, or describe your own on WhatsApp. Tell us who it's for, your budget and the day it should arrive.", waDisplay ? `WhatsApp · ${waDisplay}` : "WhatsApp", drawn(SCENE_MESSAGE))}
        {step(1, "Confirmed", "Pay your way", `${payLine === "Cash on delivery or bank transfer" ? "Cash on delivery, or a bank transfer with a photo of the slip." : `${payLine}.`} We confirm the price and the delivery day before anything is packed.`, payLine.replace(" or ", " · ").replace(/· b/, "· B"), drawn(SCENE_PAY))}
        {step(2, "Packed", "Packed by hand", "Every item goes in by hand, swaps included. The card gets written, the lid goes on and the ribbon gets tied.", "The café box, from our Instagram",
          <div className="jr-scene pack" role="img" aria-label="Items from a real BOXTOP photo dropping into the box, then a ribbon tied across it">
            <div className="pk-stage" id="pkStage">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="pk-photo" src="/home/cafe-treat.webp" alt="" width={900} height={675} loading="lazy" />
              <div className="pk-veil" />
              {STK.map((s) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={s.k} className="pk-st" src={`/home/cut/${s.k}.webp`} alt="" loading="lazy" style={{ left: `${s.l}%`, top: `${s.t}%`, width: `${s.w}%`, height: `${s.h}%` }} />
              ))}
              <span className="pk-band pk-h" /><span className="pk-band pk-v" />
              <svg className="pk-bow" viewBox="0 0 300 190" aria-hidden="true">
                <g fill="#D5136F">
                  <path d="M150 112 C 112 66, 46 38, 30 76 C 16 110, 76 128, 150 112 Z" /><path d="M150 112 C 188 66, 254 38, 270 76 C 284 110, 224 128, 150 112 Z" />
                  <path d="M146 116 L 104 186 L 122 178 L 132 190 L 156 120 Z" /><path d="M154 116 L 196 186 L 178 178 L 168 190 L 144 120 Z" />
                </g>
                <rect x="134" y="98" width="32" height="28" rx="9" fill="#b50f5e" />
              </svg>
              <div className="pk-tag"><span className="str" /><div>For Nimmi<br /><em>happy birthday!</em></div></div>
            </div>
          </div>)}
        {step(3, "Dispatched", "On its way", `Out for delivery around ${listOf(near) || "Colombo"}. We'll message you when it leaves, so you know when to expect the call.`, near.join(" · ") || "Colombo", drawn(SCENE_VAN))}
        {step(4, "Delivered", "At their door", "Handed to the person it's for. The surprise, and the credit, are all yours.", proof || "Delivered by hand", drawn(SCENE_DOOR))}

        <div className="jr-track" aria-hidden="true">
          <div className="jr-line"><i id="jrFill" /></div>
          <ol className="jr-nodes">
            {["Pending", "Confirmed", "Packed", "Dispatched", "Delivered"].map((l, n) => <li key={l} className={n === 0 ? "jr-node is-done" : "jr-node"}><span />{l}</li>)}
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="jr-trav" id="jrTrav"><img src="/brand/logo.jpg" alt="" width={40} height={40} /></div>
        </div>
      </div>

      <div className="or-final">
        <div className="or-copy">
          <p className="eyebrow">Order</p>
          <h2>Tied, tagged, <em>on its way</em></h2>
          <p>Pick a box above or build your own, then message us. We&apos;ll confirm the price and the delivery day before anything is packed.</p>
          <div className="or-cta">
            <a className="btn btn-ribbon" href={waHref} target="_blank" rel="noopener">Order on WhatsApp</a>
            <a className="btn btn-ghost" href="#build" onClick={(e) => { e.preventDefault(); scrollToEl(document.getElementById("build")); }}>Build a box first</a>
          </div>
          {notes.length > 0 && (
            <div className="reviews">
              {notes.slice(0, 2).map((r, n) => <figure className="rv" key={n}><blockquote>&ldquo;{r.text}&rdquo;</blockquote><figcaption>{r.by}</figcaption></figure>)}
            </div>
          )}
        </div>
        <div className="or-side">
          <div className="fact">
            <p className="eyebrow">Where we deliver</p>
            <h3>Around Colombo and the Western Province</h3>
            <ul className="areas">{areas.map((a) => <li key={a}>{a}</li>)}</ul>
            <p>Colombo, Gampaha and Kalutara make up the Western Province, home to <b>6.1 million people</b>. We deliver within Sri Lanka; fees and time slots are on the <Link href="/delivery">delivery page</Link>.</p>
            <small>2024 Census of Population and Housing. Ask us about anywhere else.</small>
          </div>
          <div className="fact">
            <p className="eyebrow">Reach us</p>
            <dl className="facts">
              {wa && <><dt>WhatsApp</dt><dd><a href={waHref} target="_blank" rel="noopener">{waDisplay}</a><small>{hours}</small></dd></>}
              {instagram && <><dt>Instagram</dt><dd><a href={instagram} target="_blank" rel="noopener">{igHandle}</a><small>Every box we pack, as it leaves</small></dd></>}
              {facebook && <><dt>Facebook</dt><dd><a href={facebook} target="_blank" rel="noopener">BOX TOP</a><small>{proof}</small></dd></>}
              <dt>Payment</dt><dd>{payLine}</dd>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
