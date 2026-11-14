// The cities people send boxes home from, and the clock maths the section shows: local time against Colombo's,
// and whether it is night at home right now. Small and dependency-free, so it can load with the page.

export type City = { n: string; tz: string; lon: number; lat: number };
export const CITIES: Record<string, City> = {
  CMB: { n: "Colombo", tz: "Asia/Colombo", lon: 79.86, lat: 6.93 },
  DXB: { n: "Dubai", tz: "Asia/Dubai", lon: 55.27, lat: 25.2 },
  DOH: { n: "Doha", tz: "Asia/Qatar", lon: 51.53, lat: 25.29 },
  RUH: { n: "Riyadh", tz: "Asia/Riyadh", lon: 46.68, lat: 24.71 },
  KWI: { n: "Kuwait", tz: "Asia/Kuwait", lon: 47.98, lat: 29.38 },
  TLV: { n: "Tel Aviv", tz: "Asia/Jerusalem", lon: 34.78, lat: 32.08 },
  LHR: { n: "London", tz: "Europe/London", lon: -0.13, lat: 51.5 },
  MXP: { n: "Milan", tz: "Europe/Rome", lon: 9.19, lat: 45.46 },
  ICN: { n: "Seoul", tz: "Asia/Seoul", lon: 126.98, lat: 37.57 },
  MEL: { n: "Melbourne", tz: "Australia/Melbourne", lon: 144.96, lat: -37.81 },
  YYZ: { n: "Toronto", tz: "America/Toronto", lon: -79.38, lat: 43.65 },
};
/** Where people fly from, in the order the globe tours them. */
export const ORIGINS = ["DXB", "DOH", "RUH", "KWI", "TLV", "LHR", "MXP", "ICN", "MEL", "YYZ"];

const DAY = 864e5, D = Math.PI / 180;
const pad2 = (n: number) => (n < 10 ? "0" : "") + n;

/** Where the sun is overhead at this instant. */
export function sunAt(d: Date) {
  const N = (d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0)) / DAY;
  return { lat: -23.44 * Math.cos(((2 * Math.PI) / 365) * (N + 10)), lon: -15 * (d.getUTCHours() + d.getUTCMinutes() / 60 - 12) };
}
/** Minutes a time zone is ahead of UTC at this instant. */
export function tzOffset(tz: string, d: Date) {
  try {
    const p: Record<string, string> = {};
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(d).forEach((x) => { p[x.type] = x.value; });
    return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - Math.floor(d.getTime() / 60000) * 60000) / 60000);
  } catch { return null; }
}
export function clockIn(tz: string, d: Date) {
  try { return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(d); } catch { return "--:--"; }
}
export function gapText(code: string, d: Date) {
  const off = tzOffset(CITIES[code].tz, d), home = tzOffset("Asia/Colombo", d);
  if (off == null || home == null) return "";
  const g = home - off, a = Math.abs(g);
  if (g === 0) return "Same time";
  return `Home is ${Math.floor(a / 60)}${a % 60 ? ":" + pad2(a % 60) : ""}h ${g > 0 ? "ahead" : "behind"}`;
}
export function flightNo(code: string) { let s = 0; for (let i = 0; i < code.length; i++) s = s * 7 + code.charCodeAt(i); return "BX " + (100 + (s % 900)); }
/** True when the sun is below the horizon in Colombo. */
export function nightAtHome(d: Date) {
  const s = sunAt(d), h = CITIES.CMB;
  return Math.sin(h.lat * D) * Math.sin(s.lat * D) + Math.cos(h.lat * D) * Math.cos(s.lat * D) * Math.cos((h.lon - s.lon) * D) < 0;
}
