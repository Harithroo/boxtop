import "server-only";
import { and, asc, desc, eq, gte, inArray, like, lt, or, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { loadBoxes, loadBoxFull } from "@/db/loaders";

export const BUDGETS = [
  { id: "u5", label: "Under Rs. 5,000", min: 0, max: 5000 },
  { id: "5-10", label: "Rs. 5,000–10,000", min: 5000, max: 10000 },
  { id: "10-20", label: "Rs. 10,000–20,000", min: 10000, max: 20000 },
  { id: "20p", label: "Rs. 20,000+", min: 20000, max: Infinity },
];

export const SORTS = { popular: "Popular", "price-asc": "Price, low to high", "price-desc": "Price, high to low", new: "Newest" } as const;

export async function listBoxes(opts: { collectionId?: number; q?: string; budget?: string; sort?: string; featured?: boolean; limit?: number } = {}) {
  const where: SQL[] = [eq(schema.boxes.status, "ACTIVE")];
  if (opts.featured) where.push(eq(schema.boxes.featured, true));
  const b = BUDGETS.find((x) => x.id === opts.budget);
  if (b) {
    where.push(gte(schema.boxes.price, b.min));
    if (b.max !== Infinity) where.push(lt(schema.boxes.price, b.max));
  }
  if (opts.q) {
    const q = `%${opts.q.trim()}%`;
    // package codes: "15", "p15", "package 15" all find P15
    const num = opts.q.match(/\d+/)?.[0];
    const ors = [like(schema.boxes.name, q), like(schema.boxes.summary, q), like(schema.boxes.code, q)];
    if (num) ors.push(eq(schema.boxes.code, `P${num}`));
    where.push(or(...ors)!);
  }
  if (opts.collectionId) {
    const ids = (await db.select({ id: schema.boxCollections.boxId }).from(schema.boxCollections).where(eq(schema.boxCollections.collectionId, opts.collectionId))).map((r) => r.id);
    if (!ids.length) return [];
    where.push(inArray(schema.boxes.id, ids));
  }
  const order =
    opts.sort === "price-asc" ? [asc(schema.boxes.price)] :
    opts.sort === "price-desc" ? [desc(schema.boxes.price)] :
    opts.sort === "new" ? [desc(schema.boxes.createdAt)] :
    [desc(schema.boxes.featured), asc(schema.boxes.sortOrder), desc(schema.boxes.id)];

  return loadBoxes(and(...where), order, opts.limit);
}

export async function getCollections(kind?: (typeof schema.collectionKind)[number]) {
  return db.select().from(schema.collections)
    .where(kind ? eq(schema.collections.kind, kind) : undefined)
    .orderBy(asc(schema.collections.sortOrder), asc(schema.collections.name));
}

export async function getCollection(kind: (typeof schema.collectionKind)[number], slug: string) {
  const [c] = await db.select().from(schema.collections).where(and(eq(schema.collections.kind, kind), eq(schema.collections.slug, slug)));
  return c ?? null;
}

export async function getBoxBySlug(slug: string) {
  return loadBoxFull(and(eq(schema.boxes.slug, slug), eq(schema.boxes.status, "ACTIVE"))!);
}

export async function getAddOns() {
  return db.select().from(schema.addOns).where(eq(schema.addOns.active, true)).orderBy(asc(schema.addOns.sortOrder));
}
