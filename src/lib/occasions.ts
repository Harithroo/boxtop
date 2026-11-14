// When an occasion falls. Pure date maths on ISO strings ("2026-12-25"), all in UTC, so the server and the
// browser always agree. "Today" is passed in: on the server it comes from colomboNow().date.
//
// Rule formats (the collections.dateRule column):
//   fixed:12-25                    the same date every year
//   nth:5-0-2                      month 5 (May), weekday 0 (Sunday), 2nd one  -> Mother's Day
//   list:2026-11-08,2027-10-28     dates that follow the moon, typed in by hand -> Deepavali, Vesak

const DAY = 86_400_000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

const utc = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); };
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const isIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(utc(s));

/** The nth given weekday of a month, e.g. the 2nd Sunday of May. */
function nthWeekday(year: number, month: number, weekday: number, n: number) {
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return Date.UTC(year, month - 1, 1 + ((weekday - firstDow + 7) % 7) + (n - 1) * 7);
}

/** True when the text is a rule this module understands. Used to validate what the owner types. */
export function isValidRule(rule: string) {
  const [kind, rest = ""] = rule.trim().split(":");
  if (kind === "fixed") { const m = rest.match(/^(\d{1,2})-(\d{1,2})$/); return !!m && +m[1] >= 1 && +m[1] <= 12 && +m[2] >= 1 && +m[2] <= 31; }
  if (kind === "nth") { const m = rest.match(/^(\d{1,2})-([0-6])-([1-5])$/); return !!m && +m[1] >= 1 && +m[1] <= 12; }
  if (kind === "list") return rest.split(",").map((s) => s.trim()).filter(Boolean).every(isIso) && rest.trim() !== "";
  return false;
}

/** The next time the rule comes round, counting today itself. Null when a list has run out or the rule is unreadable. */
export function nextDate(rule: string | null | undefined, today: string): string | null {
  if (!rule || !isValidRule(rule)) return null;
  const [kind, rest] = rule.trim().split(":");
  const t = utc(today);
  const year = new Date(t).getUTCFullYear();
  if (kind === "list") {
    const next = rest.split(",").map((s) => s.trim()).filter(Boolean).sort().find((d) => utc(d) >= t);
    return next ?? null;
  }
  const at = (y: number) => {
    const p = rest.split("-").map(Number);
    return kind === "fixed" ? Date.UTC(y, p[0] - 1, p[1]) : nthWeekday(y, p[0], p[1], p[2]);
  };
  const thisYear = at(year);
  return iso(thisYear >= t ? thisYear : at(year + 1));
}

export const daysBetween = (from: string, to: string) => Math.round((utc(to) - utc(from)) / DAY);

/** Days since 1 January, the same count the year dial is drawn with. */
export const dayOfYear = (d: string) => Math.round((utc(d) - Date.UTC(+d.slice(0, 4), 0, 1)) / DAY);

export const whenText = (days: number) => (days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`);

/** "Friday 25 December 2026" */
export function longDate(d: string) {
  const dt = new Date(utc(d));
  return `${WEEKDAYS[dt.getUTCDay()]} ${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}

/** "25 Dec" */
export function shortDate(d: string) {
  const dt = new Date(utc(d));
  return `${dt.getUTCDate()} ${MONTHS_SHORT[dt.getUTCMonth()]}`;
}
