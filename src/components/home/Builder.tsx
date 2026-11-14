"use client";
// Build a box: pick the box, who it's for, the occasion and a budget, then tap what goes inside. Each item flies
// from its tile into the box, the lid closes with a bow, and the whole thing becomes a WhatsApp message asking
// Boxtop for a quote. Nothing is sent until the customer presses send in WhatsApp.
import "./register";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { nearBudget } from "@/lib/budget-match";
import { rs } from "@/lib/format";
import { homeBus } from "@/lib/home-bus";
import type { HomeBox, HomeItem, HomeStyle } from "@/lib/home-data";
import { Bow, WaIcon } from "@/components/site/icons";
import { reducedMotion, scrollToEl } from "@/components/site/scroll";

type Props = {
  styles: HomeStyle[]; items: HomeItem[]; occasions: string[]; boxes: HomeBox[];
  starter: number[]; wa: string; waDisplay: string;
};

const WHO = ["Her", "Him", "Them"] as const;
const DEFAULT_NOTE = "Happy birthday! Hope this makes you smile.";
const MIN = 2500, MAX = 15000;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
/** Where the nth item sits on the box floor: four across, three rows, then a second layer nudged over. */
const slot = (n: number) => {
  const layer = Math.floor(n / 12), j = n % 12, col = j % 4, row = Math.floor(j / 4);
  return { left: 2.5 + col * 24.6 + layer * 6, top: 4 + row * 32 + layer * 7 };
};
const onScreen = (el: Element) => { const r = el.getBoundingClientRect(); return r.bottom > 60 && r.top < window.innerHeight - 40; };

export function Builder({ styles, items, occasions, boxes, starter, wa, waDisplay }: Props) {
  const root = useRef<HTMLElement>(null);
  const [styleId, setStyleId] = useState(styles[0]?.id ?? 0);
  const [who, setWho] = useState<string>("Her");
  const [occ, setOcc] = useState(occasions.includes("Birthday") ? "Birthday" : occasions[0] ?? "");
  const [budget, setBudget] = useState(6000);
  const [picked, setPicked] = useState<number[]>(starter);
  const [note, setNote] = useState(DEFAULT_NOTE);
  const [wrapped, setWrappedState] = useState(false);
  const [hl, setHl] = useState(false);
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState("");
  const [custom, setCustom] = useState<string | null>(null); // the message, once the customer has edited it by hand
  const [copied, setCopied] = useState<"" | "ok" | "no">("");
  const [seen, setSeen] = useState({ inside: false, box: false });
  const [narrow, setNarrow] = useState(false);

  // the animated box is driven by hand; these mirror state for its callbacks
  const pickedRef = useRef(picked);
  const wrappedRef = useRef(false);
  const sendT = useRef(0);
  const presetTok = useRef(0);
  const noop = () => {};
  const api = useRef<{ add: (id: number, from?: Element | null, quiet?: boolean) => void; remove: (id: number) => void; clear: () => void; lid: () => void }>({ add: noop, remove: noop, clear: noop, lid: noop });

  const style = styles.find((s) => s.id === styleId) ?? styles[0];
  const byId = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);
  const groups = useMemo(() => [...new Set(items.map((it) => it.group))], [items]);
  const near = useMemo(() => nearBudget(budget, boxes).slice(0, 4), [budget, boxes]);

  const built = useMemo(() => {
    const lines = ["Hi BOXTOP! I'd like a custom gift box.", "", `Box: ${style?.name ?? "any"}`, `For: ${who} · ${occ}`, `Budget: around ${rs(budget)}`,
      `Inside: ${picked.length ? picked.map((id) => byId.get(id)?.name).filter(Boolean).join(", ") : "surprise me"}`];
    if (note.trim()) lines.push(`Card note: "${note.trim()}"`);
    lines.push("", "Could you send me a quote and a delivery date?");
    return lines.join("\n");
  }, [style, who, occ, budget, picked, note, byId]);
  const msg = custom ?? built;
  const waHref = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(msg)}` : "/contact";

  const setWrapped = (on: boolean) => {
    wrappedRef.current = on;
    setWrappedState(on);
    if (on) api.current.lid();
    else { window.clearTimeout(sendT.current); setSent(false); setHl(false); setStatus(""); }
  };
  /* lid on, then lead the way to the message: it gets highlighted and focused, nothing opens on its own */
  const goMsg = () => {
    setHl(true);
    const box = root.current?.querySelector<HTMLElement>("#msgBox");
    if (!box) return;
    const r = box.getBoundingClientRect();
    scrollToEl(box, -Math.max(90, (window.innerHeight - r.height) / 2));
    window.setTimeout(() => { try { root.current?.querySelector<HTMLTextAreaElement>("#msgOut")?.focus({ preventScroll: true }); } catch {} }, reducedMotion() ? 50 : 1300);
  };
  const toggleItem = (id: number, from: Element) => {
    if (wrappedRef.current) setWrapped(false);
    const has = pickedRef.current.includes(id);
    const next = has ? pickedRef.current.filter((x) => x !== id) : [...pickedRef.current, id];
    pickedRef.current = next; setPicked(next);
    if (has) api.current.remove(id); else api.current.add(id, from);
  };
  const applyPreset = (boxId: number) => {
    const p = boxes.find((b) => b.id === boxId); if (!p) return;
    const tok = ++presetTok.current;
    if (wrappedRef.current) setWrapped(false);
    if (p.styleId && styles.some((s) => s.id === p.styleId)) setStyleId(p.styleId);
    setWho(p.who); if (occasions.includes(p.occasion)) setOcc(p.occasion);
    setBudget(p.price ? Math.min(MAX, Math.max(MIN, Math.round(p.price / 500) * 500)) : 6000);
    api.current.clear();
    const list = p.items.filter((id) => byId.has(id));
    pickedRef.current = list; setPicked(list); setCustom(null);
    scrollToEl(root.current);
    // let the page arrive, then drop the items in one after another
    window.setTimeout(() => list.forEach((id, n) => window.setTimeout(() => {
      if (tok !== presetTok.current || !pickedRef.current.includes(id)) return;
      api.current.add(id);
    }, n * 140)), reducedMotion() ? 0 : 1100);
  };
  const applyRef = useRef(applyPreset);
  useEffect(() => { applyRef.current = applyPreset; });

  useGSAP((_, contextSafe) => {
    const el = root.current!, reduce = reducedMotion();
    const bx = el.querySelector<HTMLElement>("#bx")!, floor = el.querySelector<HTMLElement>("#bxFloor")!;
    const chip = (id: number) => floor.querySelector<HTMLElement>(`.pk[data-item="${id}"]`);

    const layout = contextSafe!((animate: boolean) => {
      floor.querySelectorAll<HTMLElement>(".pk").forEach((c, n) => {
        const p = slot(n);
        if (animate && !reduce) gsap.to(c, { left: p.left + "%", top: p.top + "%", duration: 0.45, ease: "power2.out" });
        else { c.style.left = p.left + "%"; c.style.top = p.top + "%"; }
      });
    });
    const add = contextSafe!((id: number, from?: Element | null, quiet?: boolean) => {
      const it = byId.get(id);
      if (!it || chip(id)) return;
      const c = document.createElement("div");
      c.className = "pk"; c.dataset.item = String(id);
      const im = document.createElement("img"); im.src = it.img ?? "/brand/logo.jpg"; im.alt = it.name; c.appendChild(im);
      const rot = rnd(-10, 10);
      c.style.rotate = rot.toFixed(1) + "deg";
      floor.appendChild(c);
      layout(false);
      if (quiet || reduce) return;
      const src = from?.querySelector("img");
      if (src && onScreen(bx) && onScreen(src)) {
        /* fly from the tile you tapped into its spot in the box */
        const a = src.getBoundingClientRect(), b = c.getBoundingClientRect();
        const fl = document.createElement("img");
        fl.className = "flyer"; fl.src = src.src; fl.alt = "";
        fl.style.cssText = `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px`;
        document.body.appendChild(fl);
        gsap.set(c, { opacity: 0 });
        const mx = (a.left + b.left) / 2, my = Math.min(a.top, b.top) - 90;
        gsap.timeline({ onComplete: () => fl.remove() })
          .to(fl, { keyframes: [
            { left: mx, top: my, width: ((a.width + b.width) / 2) * 1.1, height: ((a.height + b.height) / 2) * 1.1, rotation: rot * 2, duration: 0.36, ease: "power2.out" },
            { left: b.left, top: b.top, width: b.width, height: b.height, rotation: rot, duration: 0.36, ease: "power2.in" },
          ] })
          .set(c, { opacity: 1 })
          .fromTo(c, { scale: 1.2 }, { scale: 1, duration: 0.45, ease: "back.out(3)" })
          .to(fl, { opacity: 0, duration: 0.06 }, "<");
      } else {
        gsap.from(c, { y: -240, scale: 1.25, rotation: rnd(-40, 40), opacity: 0, duration: 0.85, ease: "bounce.out" });
      }
    });
    const remove = contextSafe!((id: number) => {
      const c = chip(id);
      if (!c) return;
      if (!reduce) gsap.to(c, { y: -200, rotation: rnd(-30, 30), opacity: 0, duration: 0.35, ease: "power2.in", onComplete: () => { c.remove(); layout(true); } });
      else { c.remove(); layout(false); }
    });
    const lid = contextSafe!(() => {
      if (reduce) return;
      gsap.fromTo("#bxLid .bx-rib-v", { scaleY: 0 }, { scaleY: 1, duration: 0.5, delay: 0.45, ease: "power3.out" });
      gsap.fromTo("#bxLid .bx-rib-h", { scaleX: 0 }, { scaleX: 1, duration: 0.5, delay: 0.55, ease: "power3.out" });
      gsap.fromTo("#bxLid .bx-bow", { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.7, delay: 0.8, ease: "back.out(2.2)" });
    });
    api.current = { add, remove, lid, clear: () => { floor.innerHTML = ""; } };
    pickedRef.current.forEach((id) => add(id, null, true));

    /* tiles deal in, group by group */
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>(".items-grid").forEach((g) => {
        gsap.from(g.querySelectorAll(".it"), { y: 30, opacity: 0, duration: 0.55, stagger: 0.04, ease: "power2.out", scrollTrigger: { trigger: g, start: "top 88%", once: true } });
      });
    });

    /* Phone tray: the box is far below the tiles on a phone, so a pill keeps count */
    const io1 = new IntersectionObserver((es) => setSeen((s) => ({ ...s, inside: es[0].isIntersecting })), { threshold: 0 });
    const io2 = new IntersectionObserver((es) => setSeen((s) => ({ ...s, box: es[0].isIntersecting })), { threshold: 0.25 });
    io1.observe(el.querySelector("#inside")!); io2.observe(bx);
    const onResize = () => setNarrow(window.innerWidth < 900);
    onResize(); window.addEventListener("resize", onResize);

    const offPreset = homeBus.on("preset", (id) => applyRef.current(id));
    const offOcc = homeBus.on("occasion", (v) => setOcc(v));
    return () => {
      io1.disconnect(); io2.disconnect(); window.removeEventListener("resize", onResize);
      offPreset(); offOcc();
      window.clearTimeout(sendT.current);
      floor.innerHTML = ""; document.querySelectorAll(".flyer").forEach((f) => f.remove());
    };
  }, { scope: root });

  const fill = (((budget - MIN) / (MAX - MIN)) * 100).toFixed(1) + "%";
  const copy = () => {
    const done = (ok: boolean) => { setCopied(ok ? "ok" : "no"); window.setTimeout(() => setCopied(""), 2000); };
    const select = () => { try { const t = root.current?.querySelector<HTMLTextAreaElement>("#msgOut"); t?.focus(); t?.select(); } catch {} };
    try { navigator.clipboard.writeText(msg).then(() => done(true), () => { select(); done(false); }); } catch { select(); done(false); }
  };
  const radio = (name: string, value: string, cur: string, set: (v: string) => void, n: number, swatch?: string) => (
    <span className="opt" key={value}>
      <input type="radio" name={name} id={`${name}-${n}`} value={value} checked={cur === value} onChange={() => set(value)} />
      <label htmlFor={`${name}-${n}`}>{swatch && <span className="swatch" style={{ background: swatch }} />}{value}</label>
    </span>
  );
  const showTray = narrow && seen.inside && !seen.box && picked.length > 0;

  return (
    <section id="build" aria-labelledby="b-title" ref={root}>
      <div className="b-head">
        <div>
          <p className="eyebrow">Build a box</p>
          <h2 id="b-title">Pack it your way</h2>
        </div>
        <p>Pick a box, set a budget and tap what goes in. Watch it land in the box, close the lid, and we turn it into a WhatsApp message so BOXTOP can send you a quote.</p>
      </div>
      <div className="b-grid">
        <div className="b-controls">
          <div className="b-basics">
            <fieldset>
              <legend>The box</legend>
              <div className="opts">
                {styles.map((s, n) => (
                  <span className="opt" key={s.id}>
                    <input type="radio" name="box" id={`box-${n}`} value={s.id} checked={styleId === s.id} onChange={() => setStyleId(s.id)} />
                    <label htmlFor={`box-${n}`}><span className="swatch" style={{ background: s.outer }} />{s.name}</label>
                  </span>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Who it&apos;s for</legend>
              <div className="opts">{WHO.map((w, n) => radio("who", w, who, setWho, n))}</div>
            </fieldset>
            <fieldset className="wide">
              <legend>The occasion</legend>
              <div className="opts">{occasions.map((o, n) => radio("occ", o, occ, setOcc, n))}</div>
            </fieldset>
            <div className="budget wide">
              <div className="budget-row"><label className="flabel" htmlFor="budget">Budget</label><output htmlFor="budget">{rs(budget)}</output></div>
              <input type="range" id="budget" min={MIN} max={MAX} step={500} value={budget} style={{ "--fill": fill } as CSSProperties} onChange={(e) => setBudget(Number(e.target.value))} />
              <p className="near">{near.length ? "Boxes we've packed near this price:" : "No packed boxes this close to your budget yet. Build your own."}</p>
              <div className="near-list">
                {near.map((p) => <button type="button" key={p.id} onClick={() => applyPreset(p.id)}>{p.name} · {p.price === null ? "Ask for price" : rs(p.price)}</button>)}
              </div>
            </div>
          </div>
          <div className="inside" id="inside">
            <div className="inside-head">
              <h3>What goes inside</h3>
              <p>Tap to pack it. Tap again to take it out.</p>
            </div>
            <div>
              {groups.map((g) => (
                <div className="it-group" key={g}>
                  <h4>{g}</h4>
                  <div className="items-grid">
                    {items.filter((it) => it.group === g).map((it) => (
                      <button className="it" type="button" key={it.id} aria-pressed={picked.includes(it.id)} onClick={(e) => toggleItem(it.id, e.currentTarget)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.img ?? "/brand/logo.jpg"} alt="" width={240} height={240} loading="lazy" />
                        <b>{it.name}</b><small>{it.blurb}</small>
                        <span className="add" aria-hidden="true">
                          <svg className="plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                          <svg className="ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="b-preview" id="bPreview">
          <div className={`bx${wrapped ? " is-wrapped" : ""}${sent ? " is-sent" : ""}`} id="bx" style={{ "--bx-out": style?.outer ?? "#22388f", "--bx-in": style?.inner ?? "#c99f72" } as CSSProperties}>
            <p className="bx-count" aria-live="polite"><b>{picked.length}</b> item{picked.length === 1 ? "" : "s"} packed</p>
            <p className="bx-sent"><WaIcon />Sent to WhatsApp</p>
            <div className="bx-floor" id="bxFloor" />
            <p className="bx-empty" style={{ display: picked.length ? "none" : undefined }}>Tap items to pack them in</p>
            <div className="bx-lid" id="bxLid" aria-hidden="true">
              <span className="bx-rib-v" /><span className="bx-rib-h" />
              <Bow className="bx-bow" tails={["#d81d6e", "#c9145f"]} loops="url(#bowG2)" knot="#ff4d97" gradient />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <span className="bx-sticker"><img src="/brand/logo.jpg" alt="" width={360} height={360} /></span>
            </div>
          </div>
          <button className={`lidbtn${!wrapped && picked.length > 0 ? " ready" : ""}`} type="button" aria-pressed={wrapped}
            onClick={() => {
              if (wrapped) { goMsg(); return; }
              setWrapped(true);
              setStatus("Lid on, ribbon tied. Last step: your message below.");
              sendT.current = window.setTimeout(goMsg, reducedMotion() ? 100 : 1400);
            }}>
            <WaIcon className="wa" />
            <Bow className="bow" tails={["#7a0b3b", "#7a0b3b"]} loops="#fff" knot="#ffd2e5" />
            <span>
              <span>{wrapped ? "Lid on · check your message ↓" : "Close the lid & tie the ribbon"}</span>
              <small>{wrapped ? "Take me to the WhatsApp message" : picked.length ? "Then check your message and send it" : "Pack a few things first, or send it as a surprise"}</small>
            </span>
          </button>
          <p className="lid-sub">
            <span aria-live="polite">{status}</span>
            {wrapped && <button className="linkbtn" type="button" onClick={() => setWrapped(false)}>Open the lid again</button>}
          </p>
        </div>
      </div>
      <div className="b-send">
        <div className="note-wrap">
          <label className="flabel" htmlFor="note">Card note</label>
          <textarea id="note" maxLength={140} placeholder="Happy birthday, akka! Love you loads." value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="note-tag" aria-hidden="true">{note.trim() || "Your note shows up here"}</div>
        </div>
        <div className={`msg${hl ? " is-hl" : ""}`} id="msgBox">
          {hl && <p className="msg-step"><b>Last step</b> Check your message, change anything you like, then send it.</p>}
          <div className="msg-top">
            <label className="flabel" htmlFor="msgOut">Your WhatsApp message</label>
            {custom !== null && <button className="linkbtn" type="button" onClick={() => setCustom(null)}>Rebuild from my box</button>}
          </div>
          <textarea id="msgOut" rows={9} spellCheck value={msg} onChange={(e) => setCustom(e.target.value)} />
          <div className="msg-cta">
            <a className="btn btn-ribbon" id="waLink" href={waHref} target="_blank" rel="noopener"
              onClick={() => { if (wrapped) { setSent(true); setStatus("Sent to WhatsApp. Press send there to reach BOXTOP."); } }}>Send on WhatsApp</a>
            <button className="btn btn-ghost" type="button" onClick={copy}>{copied === "ok" ? "Copied" : copied === "no" ? "Select and copy above" : "Copy message"}</button>
          </div>
          <p className="msg-note">Opens WhatsApp with this message{waDisplay ? ` to ${waDisplay}` : ""}. Nothing is sent until you press send there.</p>
        </div>
      </div>
      <div className={`b-tray${showTray ? " show" : ""}`} aria-hidden="true">
        <span className="thumbs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {picked.slice(-3).map((id) => <img key={id} src={byId.get(id)?.img ?? "/brand/logo.jpg"} alt="" />)}
        </span>
        <span>{picked.length} packed</span>
        <button type="button" tabIndex={-1} onClick={() => scrollToEl(root.current?.querySelector("#bx"), -90)}>See the box</button>
      </div>
    </section>
  );
}
