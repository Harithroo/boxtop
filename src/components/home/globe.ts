// The dotted globe of the "send a box home" section: land drawn as dots, lit by where the sun is right now,
// with a plane that flies the chosen route to Colombo and a gift that lands there. Plain canvas, no libraries.
// Loaded on demand (it carries ~3,500 land dots), so it never weighs on the first paint.
import { CITIES, ORIGINS, sunAt } from "./cities";
import { LAND } from "./land";

const D = Math.PI / 180;

// the colours that differ between the site themes (the rest of the globe is the same in both)
const PALETTE = {
  light: { sea: ["#3a2463", "#160c27"], ribbon: "#d5136f", glow: "rgba(213,19,111,.8)", plane: "#fffdf7", ping: "203,183,224" },
  dark: { sea: ["#2a1a52", "#0d0719"], ribbon: "#ff3d8b", glow: "rgba(255,61,139,.8)", plane: "#fdf3d8", ping: "242,196,109" },
};

type Opts = {
  wrap: HTMLElement; canvas: HTMLCanvasElement; pins: HTMLElement[]; reduce: boolean;
  current: () => string; touring: () => boolean; onTour: (next: string) => void;
  theme?: keyof typeof PALETTE;
};

export function createGlobe({ wrap, canvas, pins: pinEls, reduce, current, touring, onTour, theme = "light" }: Opts) {
  const P = PALETTE[theme];
  const ctx = canvas.getContext("2d");
  const n = LAND.length / 2, SP = new Float32Array(n), CP = new Float32Array(n), LO = new Float32Array(n), NIGHT = new Uint8Array(n);
  for (let i = 0; i < n; i++) { const la = (LAND[2 * i] / 10) * D; SP[i] = Math.sin(la); CP[i] = Math.cos(la); LO[i] = (LAND[2 * i + 1] / 10) * D; }
  let size = 0, dpr = 1, R = 0, C = 0, dot = 1.3;
  const view = { lon: 62 * D, lat: 20 * D }, tgt = { lon: 62 * D, lat: 20 * D };
  let vel = 0, userUntil = 0, running = false, raf = 0, last = 0;
  let drag: { x: number; y: number; lon: number; lat: number; lx: number; lt: number } | null = null;
  const flight = { t0: 0 }, home = CITIES.CMB;
  const PLANE = new Path2D("M-18 -2.6 L13 -2.6 C19 -2.6 23 -1.2 23 0 C23 1.2 19 2.6 13 2.6 L-18 2.6 C-20 2.6 -21 1.4 -21 0 C-21 -1.4 -20 -2.6 -18 -2.6 Z M4 -2.4 L-5 -18 L-9.5 -18 L-5.5 -2.4 Z M4 2.4 L-5 18 L-9.5 18 L-5.5 2.4 Z M-13 -2.2 L-18 -9 L-21 -9 L-18.5 -2.2 Z M-13 2.2 L-18 9 L-21 9 L-18.5 2.2 Z");
  type V3 = [number, number, number];
  const vec = (lat: number, lon: number): V3 => { const a = lat * D, b = lon * D; return [Math.cos(a) * Math.cos(b), Math.cos(a) * Math.sin(b), Math.sin(a)]; };
  /* orthographic view of a world vector; h lifts it off the surface */
  const project = (v: V3, h: number) => {
    const lo = Math.atan2(v[1], v[0]), cp = Math.sqrt(v[0] * v[0] + v[1] * v[1]), sp = v[2];
    const dl = lo - view.lon, c = Math.cos(dl), s0 = Math.sin(view.lat), c0 = Math.cos(view.lat), k = 1 + (h || 0);
    const x = cp * Math.sin(dl), y = c0 * sp - s0 * cp * c, z = s0 * sp + c0 * cp * c;
    return { x: C + R * x * k, y: C - R * y * k, z, vis: z > 0 || (x * x + y * y) * k * k > 1 };
  };
  const slerp = (a: V3, b: V3, t: number): V3 => {
    const d = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))), s = Math.sin(d);
    if (s < 1e-6) return [a[0], a[1], a[2]];
    const p = Math.sin((1 - t) * d) / s, q = Math.sin(t * d) / s;
    return [a[0] * p + b[0] * q, a[1] * p + b[1] * q, a[2] * p + b[2] * q];
  };
  let A: V3 | null = null, ANG = 1;
  const B = vec(home.lat, home.lon);
  const setRoute = (code: string) => {
    const c = CITIES[code]; A = vec(c.lat, c.lon);
    ANG = Math.acos(A[0] * B[0] + A[1] * B[1] + A[2] * B[2]);
    const m = slerp(A, B, 0.5);
    tgt.lon = Math.atan2(m[1], m[0]);
    tgt.lat = Math.max(-25 * D, Math.min(48 * D, Math.asin(m[2]) * 0.85));
    flight.t0 = performance.now();
  };
  const alt = (t: number) => 0.16 * Math.sin(Math.PI * t) * Math.min(1, ANG / 1.1);
  const routePt = (t: number) => project(slerp(A!, B, t), alt(t));
  const nightUpdate = () => {
    const s = sunAt(new Date()), sv = vec(s.lat, s.lon);
    for (let i = 0; i < n; i++) NIGHT[i] = CP[i] * Math.cos(LO[i]) * sv[0] + CP[i] * Math.sin(LO[i]) * sv[1] + SP[i] * sv[2] < 0 ? 1 : 0;
  };
  nightUpdate();
  const nightT = window.setInterval(nightUpdate, 60000);

  const pins = pinEls.map((el) => { const k = el.dataset.c!, c = CITIES[k]; return { el, v: vec(c.lat, c.lon), k, live: undefined as boolean | undefined }; });

  const resize = () => {
    const w = wrap.clientWidth; if (!w) return;
    dpr = Math.min(2, window.devicePixelRatio || 1); size = w;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(w * dpr);
    R = w * 0.44; C = w / 2; dot = Math.max(1, R / 170);
  };
  const COLS = ["#d8c8f6", "rgba(216,200,246,.42)", "#6c5a98", "rgba(108,90,152,.4)"];
  const strokeRoute = (t0: number, t1: number) => {
    if (!ctx || t1 <= t0) return;
    const steps = Math.max(2, Math.ceil(80 * (t1 - t0)));
    let on = false;
    ctx.beginPath();
    for (let s = 0; s <= steps; s++) {
      const pt = routePt(t0 + ((t1 - t0) * s) / steps);
      if (!pt.vis) { on = false; continue; }
      if (on) ctx.lineTo(pt.x, pt.y); else { ctx.moveTo(pt.x, pt.y); on = true; }
    }
    ctx.stroke();
  };
  const draw = (now: number) => {
    if (!ctx) return;
    const T = (now - flight.t0) / 1000, FLY = 3.4;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size);
    /* the sphere */
    const g = ctx.createRadialGradient(C - R * 0.35, C - R * 0.4, R * 0.1, C, C, R);
    g.addColorStop(0, P.sea[0]); g.addColorStop(1, P.sea[1]);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(C, C, R, 0, 7); ctx.fill();
    /* land dots, brighter on the day side, fading to the edge */
    const s0 = Math.sin(view.lat), c0 = Math.cos(view.lat), Bk: number[][] = [[], [], [], []];
    for (let i = 0; i < n; i++) {
      const dl = LO[i] - view.lon, c = Math.cos(dl), z = s0 * SP[i] + c0 * CP[i] * c;
      if (z < 0.03) continue;
      const x = CP[i] * Math.sin(dl), y = c0 * SP[i] - s0 * CP[i] * c;
      Bk[(NIGHT[i] ? 2 : 0) + (z < 0.32 ? 1 : 0)].push(C + R * x, C - R * y);
    }
    for (let b = 0; b < 4; b++) {
      const L = Bk[b]; if (!L.length) continue;
      ctx.fillStyle = COLS[b]; ctx.beginPath();
      for (let j = 0; j < L.length; j += 2) ctx.rect(L[j] - dot, L[j + 1] - dot, dot * 2, dot * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(203,183,224,.28)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(C, C, R, 0, 7); ctx.stroke();
    if (!A) return;
    /* the route: faint dashes all the way, bright trail behind the plane */
    let p = Math.min(1, Math.max(0, T / FLY)); p = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    if (reduce) p = 0.55;
    const fade = T > 5.2 ? Math.max(0, 1 - (T - 5.2) / 0.4) : 1;
    ctx.save(); ctx.lineCap = "round";
    ctx.setLineDash([2, 6]); ctx.strokeStyle = "rgba(203,183,224,.35)"; ctx.lineWidth = 1.2;
    strokeRoute(0, 1);
    ctx.setLineDash([]);
    ctx.globalAlpha = fade; ctx.shadowColor = P.glow; ctx.shadowBlur = 12;
    ctx.strokeStyle = P.ribbon; ctx.lineWidth = 2.6; strokeRoute(0, p);
    ctx.restore();
    /* the plane */
    if (T < FLY + 0.3 || reduce) {
      const a = routePt(p), q = routePt(Math.min(1, p + 0.01)), q0 = routePt(Math.max(0, p - 0.01));
      if (a.vis) {
        const ang = p > 0.98 ? Math.atan2(a.y - q0.y, a.x - q0.x) : Math.atan2(q.y - a.y, q.x - a.x);
        const sc = ((0.7 + 0.55 * Math.sin(Math.PI * p)) * size) / 560;
        ctx.save(); ctx.globalAlpha = reduce ? 1 : Math.min(1, (FLY + 0.3 - T) / 0.3);
        ctx.translate(a.x, a.y); ctx.rotate(ang); ctx.scale(sc, sc);
        ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
        ctx.fillStyle = P.plane; ctx.fill(PLANE);
        ctx.shadowColor = "transparent"; ctx.fillStyle = P.ribbon; ctx.fillRect(-14, -1, 26, 2);
        ctx.restore();
      }
    }
    /* landing: a ping and a gift dropping onto Colombo */
    const hp = project(B, 0);
    if (T > FLY && T < 5.6 && hp.vis && !reduce) {
      const k = (T - FLY) / 1.2;
      if (k < 1) { ctx.strokeStyle = `rgba(${P.ping},${1 - k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hp.x, hp.y, 8 + k * 34, 0, 7); ctx.stroke(); }
      const d = Math.min(1, (T - FLY) / 0.7), bounce = d < 1 ? 1 - Math.abs(Math.cos(d * Math.PI * 1.5)) * (1 - d) : 1;
      const gy = hp.y - 30 - (1 - bounce) * 36, al = T > 5 ? Math.max(0, 1 - (T - 5) / 0.5) : 1, u = size / 560;
      ctx.save(); ctx.globalAlpha = al; ctx.translate(hp.x, gy); ctx.scale(u, u);
      ctx.fillStyle = "#22388f"; ctx.fillRect(-11, -9, 22, 18);
      ctx.fillStyle = "#2d47a6"; ctx.fillRect(-13, -12, 26, 6);
      ctx.fillStyle = P.ribbon; ctx.fillRect(-2, -12, 4, 21);
      ctx.beginPath(); ctx.ellipse(-5, -15, 5, 3, -0.5, 0, 7); ctx.ellipse(5, -15, 5, 3, 0.5, 0, 7); ctx.fill();
      ctx.restore();
    }
  };
  const placePins = () => {
    const cur = current();
    pins.forEach((pn) => {
      const pt = project(pn.v, 0), o = Math.max(0, Math.min(1, (pt.z - 0.08) / 0.22));
      pn.el.style.transform = `translate(${pt.x.toFixed(1)}px,${pt.y.toFixed(1)}px) scale(${(0.7 + 0.3 * Math.max(0, pt.z)).toFixed(3)})`;
      pn.el.style.opacity = o.toFixed(2);
      const live = o > 0.4;
      if (pn.live !== live) { pn.live = live; pn.el.style.pointerEvents = live ? "auto" : "none"; pn.el.tabIndex = live ? 0 : -1; }
      pn.el.classList.toggle("is-on", pn.k === cur);
    });
  };
  const shortest = (a: number, b: number) => { let d = (b - a) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (!drag) {
      if (now < userUntil) { view.lon -= vel * dt; vel *= Math.pow(0.05, dt); }
      else { const k = 1 - Math.pow(0.12, dt); view.lon += shortest(view.lon, tgt.lon) * k; view.lat += (tgt.lat - view.lat) * k; }
    }
    draw(now); placePins();
    if ((now - flight.t0) / 1000 > 6.1) {
      if (touring()) onTour(ORIGINS[(ORIGINS.indexOf(current()) + 1) % ORIGINS.length]);
      else flight.t0 = now;
    }
    if (running) raf = requestAnimationFrame(frame);
  };
  const start = () => { if (running || reduce) return; running = true; last = 0; raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  const still = () => { view.lon = tgt.lon; view.lat = tgt.lat; draw(performance.now()); placePins(); };

  /* drag to spin, with a little momentum */
  const down = (e: PointerEvent) => {
    if ((e.target as Element).closest(".gp") || e.button > 0) return;
    drag = { x: e.clientX, y: e.clientY, lon: view.lon, lat: view.lat, lx: e.clientX, lt: performance.now() };
    vel = 0; wrap.classList.add("drag");
    try { wrap.setPointerCapture(e.pointerId); } catch {}
  };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    const now = performance.now(), dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    view.lon = drag.lon - (dx / size) * Math.PI * 1.1;
    view.lat = Math.max(-40 * D, Math.min(60 * D, drag.lat + (dy / size) * Math.PI * 0.8));
    const dtt = Math.max(8, now - drag.lt) / 1000; vel = (((e.clientX - drag.lx) / size) * Math.PI * 1.1) / dtt; drag.lx = e.clientX; drag.lt = now;
    if (!running) { draw(now); placePins(); }
  };
  const endDrag = () => { if (!drag) return; drag = null; wrap.classList.remove("drag"); userUntil = performance.now() + 3500; };
  wrap.addEventListener("pointerdown", down); wrap.addEventListener("pointermove", move);
  wrap.addEventListener("pointerup", endDrag); wrap.addEventListener("pointercancel", endDrag);
  const ro = new ResizeObserver(() => { resize(); if (!running) still(); });
  ro.observe(wrap);
  resize();
  const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) start(); else stop(); }, { rootMargin: "80px" });
  io.observe(wrap);

  return {
    route(code: string) { setRoute(code); if (!running) still(); },
    destroy() {
      stop(); ro.disconnect(); io.disconnect(); window.clearInterval(nightT);
      wrap.removeEventListener("pointerdown", down); wrap.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerup", endDrag); wrap.removeEventListener("pointercancel", endDrag);
    },
  };
}
