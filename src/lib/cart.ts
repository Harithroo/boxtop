import "server-only";
import { cookies } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { loadBoxes } from "@/db/loaders";

export type CartCookie = {
  lines: { b: number; q: number }[];
  addons: { a: number; q: number }[];
  builds?: { k: string; s: number; i: [number, number][]; q: number; m?: string }[]; // build-your-own: size, [itemId, qty][], quantity, card note
  zoneId?: number;
  date?: string;
  slotId?: number;
};

const NAME = "bt_cart";

export async function readCart(): Promise<CartCookie> {
  const raw = (await cookies()).get(NAME)?.value;
  if (!raw) return { lines: [], addons: [] };
  try {
    const c = JSON.parse(raw) as CartCookie;
    return { lines: c.lines ?? [], addons: c.addons ?? [], builds: c.builds ?? [], zoneId: c.zoneId, date: c.date, slotId: c.slotId };
  } catch {
    return { lines: [], addons: [] };
  }
}

export async function writeCart(c: CartCookie) {
  (await cookies()).set(NAME, JSON.stringify(c), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 14 });
}

export async function clearCart() {
  (await cookies()).delete(NAME);
}

export async function cartCount() {
  const c = await readCart();
  return c.lines.reduce((n, l) => n + l.q, 0) + (c.builds ?? []).reduce((n, b) => n + b.q, 0);
}

/** Cart joined with live prices. Drops boxes that are no longer active. */
export async function loadCart() {
  const c = await readCart();
  const boxIds = c.lines.map((l) => l.b);
  const addIds = c.addons.map((a) => a.a);
  const boxRows = boxIds.length
    ? await loadBoxes(and(inArray(schema.boxes.id, boxIds), eq(schema.boxes.status, "ACTIVE")), [])
    : [];
  const addRows = addIds.length ? await db.select().from(schema.addOns).where(and(inArray(schema.addOns.id, addIds), eq(schema.addOns.active, true))) : [];

  const lines = c.lines
    .map((l) => ({ box: boxRows.find((b) => b.id === l.b), q: l.q }))
    .filter((l): l is { box: (typeof boxRows)[number]; q: number } => !!l.box);
  const addons = c.addons
    .map((a) => ({ addOn: addRows.find((r) => r.id === a.a), q: a.q }))
    .filter((a): a is { addOn: (typeof addRows)[number]; q: number } => !!a.addOn);

  // bulk price tiers: the best tier the quantity reaches
  const tiers = boxIds.length ? await db.select().from(schema.priceTiers).where(inArray(schema.priceTiers.boxId, boxIds)) : [];
  const unitFor = (boxId: number, base: number, q: number) =>
    Math.min(base, ...tiers.filter((t) => t.boxId === boxId && q >= t.minQty).map((t) => t.unitPrice));
  const pricedLines = lines.map((l) => ({ ...l, unit: unitFor(l.box.id, l.box.price, l.q) }));

  const builds = await priceBuilds(c.builds ?? []);

  const subtotal = pricedLines.reduce((s, l) => s + l.unit * l.q, 0) + addons.reduce((s, a) => s + a.addOn.price * a.q, 0) + builds.reduce((s, b) => s + b.unit * b.q, 0);
  const leadDays = Math.max(0, ...lines.map((l) => l.box.leadDays));
  const sameDayOk = lines.every((l) => l.box.sameDay);
  return { cookie: c, lines: pricedLines, addons, builds, subtotal, leadDays, sameDayOk, empty: !lines.length && !builds.length };
}

/** Validates and prices build-your-own boxes against the current pool, sizes and stock. Invalid builds are dropped. */
export async function priceBuilds(raw: NonNullable<CartCookie["builds"]>) {
  if (!raw.length) return [];
  const sizes = await db.select().from(schema.builderSizes).where(inArray(schema.builderSizes.id, raw.map((b) => b.s)));
  const itemIds = [...new Set(raw.flatMap((b) => b.i.map(([id]) => id)))];
  const items = itemIds.length ? await db.select().from(schema.items).where(inArray(schema.items.id, itemIds)) : [];
  const out = [];
  for (const b of raw) {
    const size = sizes.find((x) => x.id === b.s && x.active);
    if (!size) continue;
    const allowed = size.allowedItems ? size.allowedItems.split(",").map(Number) : null;
    const chosen = b.i.map(([id, qty]) => ({ item: items.find((x) => x.id === id), qty })).filter((x) => x.item && x.item.builderEnabled && x.qty > 0 && (!allowed || allowed.includes(x.item.id)));
    const count = chosen.reduce((n, x) => n + x.qty, 0);
    if (!count || count > size.capacity) continue;
    const contents = chosen.map((x) => ({ id: x.item!.id, name: x.item!.name, qty: x.qty, price: x.item!.builderPrice ?? 0 }));
    const unit = size.basePrice + contents.reduce((s, x) => s + x.price * x.qty, 0);
    out.push({ key: b.k, size, contents, unit, q: b.q, note: b.m ?? "" });
  }
  return out;
}

