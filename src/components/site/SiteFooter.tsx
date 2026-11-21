"use client";
// The torn-poster footer: a pink sheet ripped across cream paper. The tear is drawn procedurally from a seeded
// random ridge, its flaps lift toward the pointer, and pulling the pin rips a fresh edge.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { glideTo, pauseOffscreen, reducedMotion, scrollToEl } from "./scroll";
import { useSiteTheme } from "@/components/SiteTheme";

export type FooterData = {
  wa: string; waDisplay: string; instagram: string; facebook: string;
  fromPrice: string | null; nextName: string | null; abroad: boolean; year: string;
  shop: { name: string; href: string }[];
};
/** The links a shop must show, printed along the bottom of the paper. */
const LEGAL: [string, string][] = [["Terms", "/terms"], ["Privacy", "/privacy"], ["Refunds", "/refunds"], ["Delivery policy", "/delivery-policy"], ["About", "/about"], ["Contact", "/contact"]];

// The sheet's colours in each site theme: keep sheet and paper in step with --tpf-sheet / --tpf-paper in src/styles/footer.css.
// shade darkens the sheet's edge and drop shadows, fold the paper flaps, tint the vignette and the pin's shadow.
const TONES = {
  light: { sheet: "#5b3a87", paper: "#f5efe3", shade: "#2d1a4a", fold: "#2d1a4a", tint: "#2d1a4a" },
  dark: { sheet: "#ff3d8b", paper: "#f6efe6", shade: "#3a0420", fold: "#3a1030", tint: "#1d1231" },
};
type Tone = (typeof TONES)["light"];
const NS = "http://www.w3.org/2000/svg";
const RIDGE_N = 84, START = 1.06, FLAPS = 6;

// ---------- the maths of a tear (pure) ----------
const clamp01 = (v: number) => (Number.isFinite(v) ? (v < 0 ? 0 : v > 1 ? 1 : v) : 0);
function rng(seed: number) {
  let a = (Number.isFinite(seed) ? Math.floor(seed) : 0) >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const XS = (() => {
  const r = rng(911), out: number[] = [];
  for (let i = 0; i < RIDGE_N; i++) { const u = i / (RIDGE_N - 1), j = i > 0 && i < RIDGE_N - 1 ? (r() - 0.5) * (0.8 / RIDGE_N) : 0; out.push(-0.02 + u * 1.04 + j); }
  return out;
})();
const ridgeFloor = (x: number) => { const d = Math.abs(x - 0.5); return d < 0.13 ? 0.39 : d < 0.25 ? 0.43 : 0.5; };
type Flap = { at: number; span: number; len: number; skew: number; dir: number; jag: number[] };
type Tear = { ys: number[]; rim: number[]; lag: number[]; flaps: Flap[] };
function makeTear(seed: number): Tear {
  const r = rng(seed), ph = [r() * 6.283, r() * 6.283, r() * 6.283], ys: number[] = [], rim: number[] = [], lag: number[] = [];
  for (let i = 0; i < RIDGE_N; i++) {
    const x = XS[i], d = Math.min(1, Math.abs(x - 0.5) * 2);
    const base = 0.43 + 0.3 * Math.pow(d, 1.35);
    const wander = (0.022 * Math.sin(x * 7 + ph[0]) + 0.016 * Math.sin(x * 13 + ph[1]) + 0.01 * Math.sin(x * 29 + ph[2])) * (0.45 + 0.55 * d);
    const spike = r() < 0.16 ? 2.3 : 1, jag = (r() - 0.5) * 0.022 * spike;
    ys.push(Math.min(0.8, Math.max(ridgeFloor(x), base + wander + jag)));
    rim.push(1.2 + r() * 3.6);
    lag.push(Math.min(0.48, d * 0.4 + 0.04 + 0.03 * Math.sin(x * 23 + ph[1]) + r() * 0.012));
  }
  const slots = [0.05, 0.19, 0.33, 0.67, 0.81, 0.95], up = r() < 0.5 ? [2, 4] : [1, 3];
  const flaps = slots.map((slot, k) => {
    const x = slot + (r() - 0.5) * 0.05, span = 3 + Math.floor(r() * 5), at = Math.max(0, Math.min(RIDGE_N - 1 - span, Math.round(x * (RIDGE_N - 1))));
    const dir = up.indexOf(k) >= 0 ? -1 : 1, outer = k === 0 || k === slots.length - 1;
    const len = dir < 0 ? 0.022 + r() * 0.022 : outer ? 0.085 + r() * 0.04 : 0.045 + r() * 0.05;
    return { at, span, len, skew: (r() - 0.5) * 1.1, dir, jag: [r() - 0.5, r() - 0.5, r() - 0.5, r() - 0.5] };
  });
  return { ys, rim, lag, flaps };
}
const easeTear = (t: number) => { const x = clamp01(t); if (x === 0 || x === 1) return x; const c1 = 0.9; return 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const easeInOut = (t: number) => { const x = clamp01(t); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const introYs = (tear: Tear, t: number) => tear.ys.map((y, i) => START + (y - START) * easeTear((t - tear.lag[i]) / 0.5));
const morphYs = (from: number[], to: Tear, t: number) => to.ys.map((y, i) => { const a = from[i] != null ? from[i] : y; return a + (y - a) * easeInOut((t - to.lag[i] * 0.6) / 0.6); });
const flapOpen = (tear: Tear, f: Flap, t: number) => easeTear((t - tear.lag[f.at] - 0.18) / 0.32);
function flapPoly(ys: number[], f: Flap, W: number, H: number, open: number) {
  const b = Math.min(ys.length - 1, f.at + f.span), top: number[][] = [];
  for (let k = f.at; k <= b; k++) top.push([XS[k] * W, ys[k] * H]);
  const A = top[0], B = top[top.length - 1], mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, L = f.len * H * Math.max(0, open);
  const tip = [mx + f.skew * L, my + f.dir * L];
  const side = (P: number[], Q: number[], j0: number, j1: number) => {
    const dx = Q[0] - P[0], dy = Q[1] - P[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    return [[P[0] + dx / 3 + nx * j0 * 0.22 * L, P[1] + dy / 3 + ny * j0 * 0.22 * L], [P[0] + (dx * 2) / 3 + nx * j1 * 0.22 * L, P[1] + (dy * 2) / 3 + ny * j1 * 0.22 * L]];
  };
  return top.concat(side(B, tip, f.jag[0], f.jag[1]), [tip], side(tip, A, f.jag[2], f.jag[3]));
}
const n1 = (v: number) => Math.round(v * 10) / 10;
const polyD = (p: number[][]) => (p.length ? "M" + p.map((q) => n1(q[0]) + " " + n1(q[1])).join("L") + "Z" : "");
function sheetD(ys: number[], W: number, H: number, off?: number[]) {
  let d = "M-20 -20L" + (W + 20) + " -20";
  for (let i = ys.length - 1; i >= 0; i--) d += "L" + n1(XS[i] * W) + " " + n1(ys[i] * H - (off ? off[i] : 0));
  return d + "Z";
}
function mixHex(a: string, b: string, t: number) {
  const p = (h: string) => { const s = h.replace("#", ""); return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) || 0); };
  const x = p(a), y = p(b), k = clamp01(t);
  return "#" + x.map((v, i) => ("0" + Math.round(v + (y[i] - v) * k).toString(16)).slice(-2)).join("");
}

// ---------- static drawings ----------
const SEAL = (() => {
  let d = "";
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 8.6 : 10; d += (i ? "L" : "M") + (12 + Math.cos(a) * r).toFixed(2) + " " + (12 + Math.sin(a) * r).toFixed(2); }
  return d + "Z";
})();
// the pushpin, shaded from the sheet's colour
function pinSvg(t: Tone) {
  const base = t.sheet, hi = mixHex(base, "#ffffff", 0.62), lo = mixHex(base, "#000000", 0.42), deep = mixHex(base, "#000000", 0.66);
  return '<svg viewBox="0 0 100 200" class="tpf-pin-svg" aria-hidden="true"><defs>' +
    `<linearGradient id="ppS" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${lo}"/><stop offset=".24" stop-color="${base}"/><stop offset=".4" stop-color="${hi}"/><stop offset=".58" stop-color="${base}"/><stop offset="1" stop-color="${deep}"/></linearGradient>` +
    `<radialGradient id="ppT" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="${hi}"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${lo}"/></radialGradient>` +
    '<linearGradient id="ppN" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#5b616b"/><stop offset=".4" stop-color="#f4f5f7"/><stop offset=".7" stop-color="#a3a9b2"/><stop offset="1" stop-color="#4a4f57"/></linearGradient>' +
    '<filter id="ppB" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4"/></filter></defs>' +
    '<path d="M48.3 112h3.4l-.7 76-1 4-1-4z" fill="url(#ppN)"/>' + `<ellipse cx="50" cy="191.5" rx="3.2" ry="1.1" fill="${t.tint}" opacity=".35"/>` +
    '<path d="M28 103v6.5a22 7 0 0 0 44 0V103z" fill="url(#ppS)"/><ellipse cx="50" cy="103" rx="22" ry="7" fill="url(#ppT)"/>' +
    '<path d="M41.5 38c1.6 16 4.6 26 3 36-1.8 10-13 19-14.6 29h40.2c-1.6-10-12.8-19-14.6-29-1.6-10 1.4-20 3-36z" fill="url(#ppS)"/>' +
    '<path d="M16 22v14a34 13 0 0 0 68 0V22z" fill="url(#ppS)"/><ellipse cx="50" cy="22" rx="34" ry="13" fill="url(#ppT)"/>' +
    '<ellipse cx="50" cy="22" rx="33" ry="12.3" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".8"/>' +
    '<ellipse cx="37" cy="17.5" rx="12" ry="4" fill="#fff" opacity=".7" filter="url(#ppB)"/>' +
    '<path d="M22 38c4 4.5 9.5 6.4 15 7" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round" filter="url(#ppB)"/>' +
    '<path d="M45 50c.8 8 1.6 14 .8 22" stroke="#fff" stroke-opacity=".45" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
}
const PIN_SVG = { light: pinSvg(TONES.light), dark: pinSvg(TONES.dark) };

const ico = { viewBox: "0 0 24 24", className: "tpf-ico", "aria-hidden": true, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const i = (n: number) => ({ "--i": n }) as CSSProperties;
const Wave = () => <svg {...ico}><path d="M3.5 15c1.8-3.2 3.6-3.2 5.4 0s3.6 3.2 5.4 0 3.6-3.2 5.4 0" /></svg>;

export function SiteFooter({ data }: { data: FooterData }) {
  const onHome = usePathname() === "/";
  const theme = useSiteTheme(), tone = TONES[theme];
  const root = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const pin = useRef<HTMLButtonElement>(null);
  const [toast, setToast] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [clock, setClock] = useState<[string, string]>(["--", "--"]);
  const toastT = useRef(0);
  const wa = (text?: string) => (data.wa ? `https://wa.me/${data.wa}${text ? `?text=${encodeURIComponent(text)}` : ""}` : "/contact");
  const occasion = data.nextName ?? "the next occasion";

  // ---------- the tear engine ----------
  useEffect(() => {
    const el = root.current, sv = svg.current, pinEl = pin.current;
    if (!el || !sv || !pinEl) return;
    // Built when the footer comes within a screen of the viewport, not as the page loads: the grain is a canvas
    // drawn and encoded to a PNG, and the flaps add two dozen SVG nodes, none of which a visitor sees before then.
    const build = () => {
      const reduce = reducedMotion();
      const sheetP = sv.querySelector<SVGPathElement>("#tpS")!, rimP = sv.querySelector<SVGPathElement>("#tpRim")!;
      const defs = sv.querySelector("defs")!, flapG = sv.querySelector("#tpFlaps")!;
      const flapBase = mixHex(tone.paper, "#ffffff", 0.35);
      const grads: SVGLinearGradientElement[] = [], flapEls: SVGPathElement[] = [];
      for (let k = 0; k < FLAPS * 2; k++) {
        const g = document.createElementNS(NS, "linearGradient"); g.setAttribute("id", "tpFg" + k); g.setAttribute("gradientUnits", "userSpaceOnUse");
        g.innerHTML = `<stop offset="0" stop-color="${mixHex(flapBase, tone.fold, 0.34)}"/><stop offset=".5" stop-color="${mixHex(flapBase, tone.fold, 0.08)}"/><stop offset="1" stop-color="#ffffff"/>`;
        defs.appendChild(g); grads.push(g);
        const p = document.createElementNS(NS, "path"); p.setAttribute("fill", `url(#tpFg${k})`); flapG.appendChild(p); flapEls.push(p);
      }
      // grain, once
      const c = document.createElement("canvas"); c.width = c.height = 160;
      const cx = c.getContext("2d");
      if (cx) {
        const img = cx.createImageData(160, 160), r = rng(42);
        for (let n = 0; n < img.data.length; n += 4) { const v = r() < 0.5 ? 0 : 255; img.data[n] = img.data[n + 1] = img.data[n + 2] = v; img.data[n + 3] = Math.floor(r() * 46); }
        cx.putImageData(img, 0, 0); sv.querySelector("#tpGrain")?.setAttribute("href", c.toDataURL());
      }

      const s = { W: 0, H: 0, tear: makeTear(11), prev: null as Tear | null, from: [] as number[], ys: [] as number[], mode: "wait", t0: 0, dur: 1, raf: 0, px: -1e4, py: -1e4, lift: [0, 0, 0, 0, 0, 0], busy: false, seed: 11 };
      const draw = (k: number, f: Flap | null | undefined, o: number, ys: number[]) => {
        const pathEl = flapEls[k], g = grads[k];
        if (!f || o < 0.01) { pathEl.setAttribute("d", ""); return; }
        const pts = flapPoly(ys, f, s.W, s.H, o); pathEl.setAttribute("d", polyD(pts));
        const b = Math.min(ys.length - 1, f.at + f.span), tip = pts[f.span + 3];
        g.setAttribute("x1", String(((XS[f.at] + XS[b]) / 2) * s.W)); g.setAttribute("y1", String(((ys[f.at] + ys[b]) / 2) * s.H));
        g.setAttribute("x2", String(tip[0])); g.setAttribute("y2", String(tip[1]));
      };
      const frame = (now: number) => {
        s.raf = 0;
        const W = s.W, H = s.H, tear = s.tear; if (!W || !H) return;
        let busy = false, ys: number[], p: number;
        const open = [1, 1, 1, 1, 1, 1], openOld = [0, 0, 0, 0, 0, 0];
        if (s.mode === "wait") { ys = tear.ys.map(() => START); open.fill(0); }
        else if (s.mode === "intro") { p = (now - s.t0) / s.dur; ys = introYs(tear, Math.min(1, p)); tear.flaps.forEach((f, k) => { open[k] = flapOpen(tear, f, Math.min(1, p)); }); if (p >= 1) s.mode = "rest"; else busy = true; }
        else if (s.mode === "morph") { p = (now - s.t0) / s.dur; ys = morphYs(s.from, tear, Math.min(1, p)); for (let n = 0; n < 6; n++) { open[n] = easeTear((p - 0.5) / 0.5); openOld[n] = 1 - easeInOut(p / 0.35); } if (p >= 1) s.mode = "rest"; else busy = true; }
        else ys = tear.ys;
        s.ys = ys;
        tear.flaps.forEach((f, k) => {
          const b = Math.min(ys.length - 1, f.at + f.span), mx = ((XS[f.at] + XS[b]) / 2) * W, my = ((ys[f.at] + ys[b]) / 2) * H;
          const target = reduce ? 0 : clamp01(1 - Math.hypot(s.px - mx, s.py - my) / (0.2 * Math.max(W, 520)));
          s.lift[k] += (target - s.lift[k]) * 0.14;
          if (Math.abs(target - s.lift[k]) > 0.003) busy = true;
          open[k] *= 1 + 0.32 * s.lift[k];
        });
        sheetP.setAttribute("d", sheetD(ys, W, H, tear.rim));
        rimP.setAttribute("d", sheetD(ys, W, H));
        for (let k = 0; k < FLAPS; k++) { draw(k, tear.flaps[k], open[k], ys); draw(FLAPS + k, s.prev && s.prev.flaps[k], openOld[k], ys); }
        if (busy) s.raf = requestAnimationFrame(frame);
      };
      const kick = () => { if (!s.raf) s.raf = requestAnimationFrame(frame); };
      const ro = new ResizeObserver(() => {
        s.W = el.clientWidth; s.H = el.clientHeight;
        sv.setAttribute("width", String(s.W)); sv.setAttribute("height", String(s.H)); sv.setAttribute("viewBox", `0 0 ${s.W} ${s.H}`);
        kick();
      });
      ro.observe(el);

      // the opening: chrome, pin, rip
      const timers: number[] = [];
      const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };
      let started = false;
      const start = () => {
        if (started) return; started = true;
        if (reduce) { el.classList.add("s1", "s2", "s3"); s.mode = "rest"; kick(); return; }
        el.classList.add("s1");
        later(() => el.classList.add("s2"), 640);
        later(() => { el.classList.add("is-hit", "s3"); s.mode = "intro"; s.t0 = performance.now(); s.dur = 1550; kick(); }, 1140);
        later(() => el.classList.remove("is-hit"), 1480);
      };
      const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) start(); }, { threshold: 0.22 });
      io.observe(el);

      // pointer: flaps lift toward it, the pin tilts
      const onMove = (e: PointerEvent) => {
        if (reduce) return;
        const r = el.getBoundingClientRect(); s.px = e.clientX - r.left; s.py = e.clientY - r.top;
        pinEl.style.setProperty("--tilt", Math.max(-9, Math.min(9, (s.px / r.width - 0.5) * 18)).toFixed(2) + "deg");
        kick();
      };
      const onLeave = () => { s.px = s.py = -1e4; pinEl.style.setProperty("--tilt", "0deg"); kick(); };
      // pull the pin: re-rip a new edge
      const onPin = () => {
        if (s.busy || !el.classList.contains("s3")) return;
        const next = s.seed + 1;
        const swap = () => { s.seed = next; s.prev = s.tear; s.from = s.ys.length ? s.ys : s.tear.ys; s.tear = makeTear(next); };
        if (reduce) { swap(); s.prev = null; s.mode = "rest"; kick(); return; }
        s.busy = true; pinEl.dataset.pin = "lift";
        later(() => { swap(); s.mode = "morph"; s.t0 = performance.now(); s.dur = 1150; kick(); }, 300);
        later(() => { pinEl.dataset.pin = "stab"; }, 1280);
        later(() => { pinEl.dataset.pin = "idle"; s.busy = false; }, 1720);
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      pinEl.addEventListener("click", onPin);
      return () => {
        ro.disconnect(); io.disconnect(); timers.forEach(clearTimeout); cancelAnimationFrame(s.raf);
        el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerleave", onLeave); pinEl.removeEventListener("click", onPin);
        grads.forEach((g) => g.remove()); flapEls.forEach((p) => p.remove());
        el.classList.remove("s1", "s2", "s3", "is-hit");
      };
    };
    let off: (() => void) | undefined;
    const near = new IntersectionObserver((es) => { if (!off && es.some((e) => e.isIntersecting)) { near.disconnect(); off = build(); } }, { rootMargin: "100% 0px" });
    near.observe(el);
    const unpause = pauseOffscreen([el]);
    return () => { near.disconnect(); off?.(); unpause(); };
  }, [tone.paper, tone.fold]);

  // Colombo clock
  useEffect(() => {
    let fmt: Intl.DateTimeFormat;
    try { fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Colombo" }); }
    catch { fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }); }
    const tick = () => { const t = fmt.format(new Date()).split(":"); setClock([t[0], t[1]]); };
    tick();
    const id = window.setInterval(tick, 10000);
    return () => { window.clearInterval(id); window.clearTimeout(toastT.current); };
  }, []);

  const flash = (m: string) => { setToast(m); setToastOn(true); window.clearTimeout(toastT.current); toastT.current = window.setTimeout(() => setToastOn(false), 1600); };
  const copy = () => {
    const n = data.waDisplay.replace(/\s/g, "");
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(n).then(() => flash("number copied"), () => flash(data.waDisplay));
    else flash(data.waDisplay);
  };
  // the reminder pill opens WhatsApp with a ready message: nothing is stored here
  const remind = (e: React.FormEvent) => {
    e.preventDefault();
    const v = name.trim();
    window.open(wa(`Hi BOXTOP! ${v ? `I’m ${v}. ` : ""}Please remind me before ${occasion} so I can order a box.`), "_blank", "noopener");
    setSent(true);
  };
  /** Links to home sections glide when we are already on the home page. */
  const sec = (id: string) => (e: React.MouseEvent) => {
    const t = onHome ? document.getElementById(id) : null;
    if (t) { e.preventDefault(); scrollToEl(t); }
  };
  const helpLinks: { label: string; href: string; id?: string }[] = [
    { label: "Delivery areas", href: "/delivery" },
    data.abroad ? { label: "Send from abroad", href: "/#abroad", id: "abroad" } : { label: "Track an order", href: "/track" },
    { label: "How to pay", href: "/faq" },
    { label: "Occasions", href: "/#year", id: "year" },
  ];

  return (
    <footer className="tpf" id="tpf" ref={root}>
      <svg className="tpf-stage" id="tpfSvg" ref={svg} aria-hidden="true">
        <defs>
          <radialGradient id="tpV" cx=".5" cy=".78" r=".75"><stop offset=".45" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor={tone.tint} stopOpacity=".08" /></radialGradient>
          <linearGradient id="tpL" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".16" /><stop offset=".55" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor={tone.shade} stopOpacity=".16" /></linearGradient>
          <pattern id="tpG" width="160" height="160" patternUnits="userSpaceOnUse"><image id="tpGrain" width="160" height="160" /></pattern>
          <filter id="tpD" x="-5%" y="-5%" width="110%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor={tone.shade} floodOpacity=".3" /></filter>
          <filter id="tpF" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="-2" dy="4" stdDeviation="4" floodColor={tone.shade} floodOpacity=".26" /></filter>
          <path id="tpS" />
        </defs>
        <rect className="tpf-paper" width="100%" height="100%" />
        <rect width="100%" height="100%" fill="url(#tpV)" style={{ mixBlendMode: "multiply" }} />
        <rect width="100%" height="100%" fill="url(#tpG)" opacity=".3" />
        <g className="tpf-sheet-g" filter="url(#tpD)"><path id="tpRim" className="tpf-rim" /><use href="#tpS" className="tpf-sheet" /></g>
        <use href="#tpS" fill="url(#tpL)" />
        <use href="#tpS" fill="url(#tpG)" opacity=".5" />
        <g filter="url(#tpF)" id="tpFlaps" />
      </svg>

      {/* on the sheet */}
      <div className="tpf-z tpf-top">
        <div className="tpf-row tpf-h" style={i(0)}>
          <button type="button" className="tpf-ib tpf-up" aria-label="Back to top" title="Back to top" onClick={() => glideTo(0)}><svg {...ico}><path d="M14.5 5.5 8 12l6.5 6.5" /></svg></button>
          <span style={{ width: ".6em" }} />
          {data.instagram && <a className="tpf-ib" href={data.instagram} target="_blank" rel="noopener" aria-label="Instagram"><svg {...ico}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="3.8" /><circle cx="17.1" cy="6.9" r=".6" fill="currentColor" /></svg></a>}
          {data.facebook && <a className="tpf-ib" href={data.facebook} target="_blank" rel="noopener" aria-label="Facebook"><svg {...ico}><path d="M14.5 8.5h2.5V5h-2.5c-2.5 0-4 1.8-4 4.2V11H8v3.5h2.5v6h3.5v-6h2.5l.6-3.5h-3.1V9.6c0-.7.3-1.1 1-1.1z" /></svg></a>}
        </div>
        <Link className="tpf-logo tpf-h" style={i(1)} href="/" aria-label="BOXTOP, home" onClick={sec("top")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-96.webp" alt="" /><span>BOXTOP</span>
        </Link>
        <div className="tpf-h" style={{ ...i(2), position: "relative" }}>
          {data.wa && (
            <button type="button" className="tpf-mail" aria-label={`Copy the WhatsApp number ${data.waDisplay}`} title="Copy number" onClick={copy}>
              <span>{data.waDisplay}</span>
              <svg {...ico}><path d="M13.5 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h10a2.5 2.5 0 0 0 2.5-2.5v-6.5" /><circle cx="18.5" cy="5.5" r="2.3" /></svg>
            </button>
          )}
          <span className={`tpf-toast${toastOn ? " on" : ""}`} role="status" aria-live="polite">{toast}</span>
        </div>
      </div>

      <form className="tpf-z tpf-news tpf-h" style={i(3)} onSubmit={remind}>
        <label htmlFor="tpName">a nudge on WhatsApp before the next occasion</label>
        <div className="tpf-pill" data-sent={sent}>
          <input id="tpName" type="text" placeholder="your name" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
          <span className="tpf-sent" aria-live="polite">
            {sent && <><svg {...ico} strokeWidth={2}><path d="m5.5 12.5 4 4 9-9.5" /></svg> sent to WhatsApp, hit send there</>}
          </span>
          <button type="submit" className="tpf-knob" aria-label="Ask BOXTOP on WhatsApp"><svg {...ico} strokeWidth={2}><path d="M5 12h13M13 6.5 18.5 12 13 17.5" /></svg></button>
        </div>
      </form>
      {data.fromPrice && <span className="tpf-z tpf-flank tpf-h" style={{ ...i(4), left: "24%" }}>Boxes from {data.fromPrice}</span>}
      <span className="tpf-z tpf-flank tpf-h" style={{ ...i(4), left: "76%" }} title="Local time in Colombo">
        <span className="tpf-clock" suppressHydrationWarning>CMB {clock[0]}<i aria-hidden="true">:</i>{clock[1]}</span>
      </span>
      <a className="tpf-z tpf-status tpf-h" style={i(5)} href={wa(`Hi BOXTOP! I’d like to order a box for ${occasion}.`)} target="_blank" rel="noopener">
        <i className="tpf-live" aria-hidden="true" /><span>{data.nextName ? `taking orders for ${data.nextName}` : "taking orders"}</span>
      </a>
      <span className="tpf-z tpf-badge" aria-hidden="true">
        <span className="tpf-h" style={{ ...i(6), display: "block", width: "100%", height: "100%" }}>
          <svg viewBox="0 0 24 24" className="tpf-seal">
            <path d={SEAL} fill="currentColor" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="m8.3 12.2 2.5 2.5 5-5.2" fill="none" stroke={tone.sheet} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>

      <nav className="tpf-z tpf-col tpf-h l" style={i(6)} aria-label="Shop">
        <h3>shop<Wave /></h3>
        <ul>
          {data.shop.map((c) => <li key={c.href}><Link href={c.href}>{c.name}</Link></li>)}
          <li><Link href="/build" onClick={sec("build")}>Build your own</Link></li>
        </ul>
        <Link className="tpf-big" href="/shop">shop.</Link>
      </nav>
      <nav className="tpf-z tpf-col tpf-h r" style={i(7)} aria-label="Help">
        <h3>help<Wave /></h3>
        <ul>{helpLinks.map((l) => <li key={l.href}><Link href={l.href} onClick={l.id ? sec(l.id) : undefined}>{l.label}</Link></li>)}</ul>
        {/* named like the header's button: both go to the same WhatsApp chat */}
        <a className="tpf-big" href={wa()} target="_blank" rel="noopener" aria-label="Order on WhatsApp">order.</a>
      </nav>

      <button type="button" className="tpf-pin" ref={pin} data-pin="idle" aria-label="Pull the pin: tear a new edge" title="Pull the pin">
        <span className="tpf-shadow" aria-hidden="true" />
        <span className="tpf-tilt"><span className="tpf-drop"><span className="tpf-body" dangerouslySetInnerHTML={{ __html: PIN_SVG[theme] }} /></span></span>
      </button>

      {/* printed on the paper */}
      <div className="tpf-z tpf-brand tpf-ink">
        <div className="tpf-brand-top tpf-p" style={i(0)}>
          <span className="tpf-eye">curated gift boxes</span>
          <a className="tpf-bub" href={wa()} target="_blank" rel="noopener" aria-label="Say hi on WhatsApp"><span className="tpf-dots" aria-hidden="true"><i /><i /><i /></span><b>say hi</b></a>
        </div>
        <Link className="tpf-word" href="/" aria-label="BOXTOP" onClick={sec("top")}><span>boxtop<em>.</em></span></Link>
      </div>
      <Link className="tpf-z tpf-side tpf-ink tpf-p l" style={{ ...i(1), left: "27.5%" }} href="/delivery">
        <span>delivery</span>
        <svg {...ico}><path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7z" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" /></svg>
      </Link>
      {data.abroad ? (
        <Link className="tpf-z tpf-side tpf-ink tpf-p r" style={{ ...i(2), left: "72.5%" }} href="/#abroad" onClick={sec("abroad")}>
          <span>from abroad</span>
          <svg {...ico}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5S9.5 6.1 12 3.5z" /></svg>
        </Link>
      ) : (
        <Link className="tpf-z tpf-side tpf-ink tpf-p r" style={{ ...i(2), left: "72.5%" }} href="/track">
          <span>track an order</span>
          <svg {...ico}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
        </Link>
      )}
      <div className="tpf-z tpf-foot tpf-ink">
        <nav className="tpf-legal tpf-p" style={i(3)} aria-label="Legal and company">
          {LEGAL.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <p className="tpf-copy tpf-p" style={i(4)}>
          <span className="tpf-dev">Designed &amp; developed by Shenal and Harithroo</span>
          <span>© {data.year} BOXTOP. All rights reserved.</span>
        </p>
      </div>
    </footer>
  );
}
