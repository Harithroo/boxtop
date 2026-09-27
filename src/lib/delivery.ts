import "server-only";
import { and, eq, gte, lte, notInArray, sql, asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSettings } from "./settings";

const TZ = "Asia/Colombo";

/** Today's date and current HH:MM in Sri Lanka. */
export function colomboNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}` };
}

export function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export type SlotOption = { id: number; label: string; left: number; available: boolean; reason?: string };
export type DayOption = { date: string; slots: SlotOption[] };

export async function getZones() {
  return db.select().from(schema.deliveryZones).where(eq(schema.deliveryZones.active, true)).orderBy(asc(schema.deliveryZones.sortOrder));
}

export async function findZoneForCity(city: string) {
  const zones = await getZones();
  const c = city.trim().toLowerCase();
  return zones.find((z) => z.cities.split(",").map((x) => x.trim().toLowerCase()).includes(c)) ?? null;
}

/**
 * Delivery calendar for a zone. `leadDays` = the largest lead time of the boxes in the cart.
 * Rules (all admin-editable): blackout dates, zone lead days, box lead days, same-day switch + slot cut-off, slot capacity.
 */
export async function getCalendar(opts: { zoneId: number; leadDays?: number; sameDayOk?: boolean; days?: number }): Promise<DayOption[]> {
  const settings = await getSettings();
  const [zone] = await db.select().from(schema.deliveryZones).where(eq(schema.deliveryZones.id, opts.zoneId));
  if (!zone) return [];
  const slots = await db.select().from(schema.deliverySlots).where(eq(schema.deliverySlots.active, true)).orderBy(asc(schema.deliverySlots.sortOrder));
  const now = colomboNow();
  const span = Math.min(opts.days ?? 14, settings.delivery.maxDaysAhead);
  const minLead = Math.max(zone.leadDays, opts.leadDays ?? 0);
  const sameDayAllowed = settings.delivery.sameDayEnabled && zone.sameDay && (opts.sameDayOk ?? true) && minLead === 0;
  const start = now.date;
  const end = addDays(start, span);

  const blackouts = new Set(
    (await db.select().from(schema.blackoutDates).where(and(gte(schema.blackoutDates.date, start), lte(schema.blackoutDates.date, end)))).map((b) => b.date),
  );

  // booked count per date+slot, ignoring cancelled/refunded orders
  const booked = await db
    .select({ date: schema.deliveries.date, slotId: schema.deliveries.slotId, n: sql<number>`count(*)` })
    .from(schema.deliveries)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.deliveries.orderId))
    .where(and(gte(schema.deliveries.date, start), lte(schema.deliveries.date, end), notInArray(schema.orders.status, ["CANCELLED", "REFUNDED"])))
    .groupBy(schema.deliveries.date, schema.deliveries.slotId);
  const bookedMap = new Map(booked.map((b) => [`${b.date}|${b.slotId}`, Number(b.n)]));

  const out: DayOption[] = [];
  for (let i = 0; i <= span; i++) {
    const date = addDays(start, i);
    if (blackouts.has(date)) continue;
    if (i === 0 && !sameDayAllowed) continue;
    if (i > 0 && i < minLead) continue;
    const opts2: SlotOption[] = slots.map((s) => {
      const left = s.capacity - (bookedMap.get(`${date}|${s.id}`) ?? 0);
      if (left <= 0) return { id: s.id, label: s.label, left: 0, available: false, reason: "Full" };
      if (i === 0 && now.time >= s.cutoff) return { id: s.id, label: s.label, left, available: false, reason: `Order by ${s.cutoff}` };
      return { id: s.id, label: s.label, left, available: true };
    });
    if (opts2.some((s) => s.available)) out.push({ date, slots: opts2 });
  }
  return out;
}

/** Re-check a chosen date/slot at checkout. */
export async function isSlotAvailable(zoneId: number, date: string, slotId: number, leadDays: number, sameDayOk: boolean) {
  const cal = await getCalendar({ zoneId, leadDays, sameDayOk, days: 60 });
  return !!cal.find((d) => d.date === date)?.slots.find((s) => s.id === slotId && s.available);
}
