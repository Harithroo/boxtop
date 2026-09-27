"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { saveImage } from "@/lib/uploads";
import { slugify } from "@/lib/format";

export type BoxState = { error?: string; ok?: boolean };

const optInt = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).nullable());
const B = z.object({
  name: z.string().trim().min(2, "Name is required"),
  slug: z.string().trim().optional(),
  code: z.string().trim().toUpperCase().max(20).optional(),
  summary: z.string().trim().max(255).optional(),
  description: z.string().optional(),
  price: z.coerce.number().int().min(0, "Price is required"),
  compareAtPrice: optInt,
  status: z.enum(schema.boxStatus),
  badge: z.string().trim().max(40).optional(),
  leadDays: z.coerce.number().int().min(0).default(0),
  stock: optInt,
  sortOrder: z.coerce.number().int().default(0),
  seoTitle: z.string().trim().max(190).optional(),
  seoDescription: z.string().trim().max(300).optional(),
  contents: z.string().optional(),
  tags: z.string().trim().max(500).optional(),
  tiers: z.string().optional(),
});

/** "2 x Ferrero Rocher (3 pcs)" -> {qty:2, name:"Ferrero Rocher", size:"3 pcs"} */
function parseContents(text: string) {
  return text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^(\d+)\s*[x×]\s*(.+)$/i);
    const qty = m ? Number(m[1]) : 1;
    let name = m ? m[2] : l;
    const sz = name.match(/\(([^)]+)\)\s*$/);
    const size = sz ? sz[1] : null;
    if (sz) name = name.slice(0, sz.index).trim();
    return { qty, name, size };
  });
}

export async function saveBox(_: BoxState, fd: FormData): Promise<BoxState> {
  await requireAdmin();
  const p = B.safeParse(Object.fromEntries(fd.entries()));
  if (!p.success) return { error: p.error.issues[0].message };
  const f = p.data;
  const id = Number(fd.get("id")) || 0;
  const values = {
    name: f.name, slug: slugify(f.slug || f.name), code: f.code || null, summary: f.summary || null, description: f.description || null,
    price: f.price, compareAtPrice: f.compareAtPrice, status: f.status, badge: f.badge || null, leadDays: f.leadDays, stock: f.stock,
    sortOrder: f.sortOrder, seoTitle: f.seoTitle || null, seoDescription: f.seoDescription || null,
    tags: f.tags ? f.tags.toLowerCase().split(",").map((x) => x.trim()).filter(Boolean).join(",") : null,
    featured: fd.get("featured") === "on", sameDay: fd.get("sameDay") === "on",
  };
  let boxId = id;
  try {
    if (id) await db.update(schema.boxes).set(values).where(eq(schema.boxes.id, id));
    else boxId = (await db.insert(schema.boxes).values(values).$returningId())[0].id;
  } catch (e) {
    const msg = String((e as Error).message);
    if (msg.includes("Duplicate")) return { error: msg.includes("code") ? "Another box already uses that package code." : "Another box already uses that web address (slug)." };
    throw e;
  }

  // collections
  const colIds = fd.getAll("collection").map(Number).filter(Boolean);
  await db.delete(schema.boxCollections).where(eq(schema.boxCollections.boxId, boxId));
  if (colIds.length) await db.insert(schema.boxCollections).values(colIds.map((c) => ({ boxId, collectionId: c })));

  // bulk price tiers: "10: 4200" per line
  if (typeof f.tiers === "string") {
    await db.delete(schema.priceTiers).where(eq(schema.priceTiers.boxId, boxId));
    const rows = f.tiers.split("\n").map((l) => l.match(/^\s*(\d+)\s*[:=+,\s]\s*(?:rs\.?\s*)?([\d,]+)/i)).filter(Boolean)
      .map((m) => ({ boxId, minQty: Number(m![1]), unitPrice: Number(m![2].replace(/,/g, "")) })).filter((r) => r.minQty > 1 && r.unitPrice > 0);
    if (rows.length) await db.insert(schema.priceTiers).values(rows);
  }

  // contents
  if (typeof f.contents === "string") {
    await db.delete(schema.boxContents).where(eq(schema.boxContents.boxId, boxId));
    for (const c of parseContents(f.contents)) {
      const [ex] = await db.select().from(schema.items).where(eq(schema.items.name, c.name));
      const itemId = ex ? ex.id : (await db.insert(schema.items).values({ name: c.name, size: c.size }).$returningId())[0].id;
      if (ex && c.size && ex.size !== c.size) await db.update(schema.items).set({ size: c.size }).where(eq(schema.items.id, ex.id));
      await db.insert(schema.boxContents).values({ boxId, itemId, quantity: c.qty }).onDuplicateKeyUpdate({ set: { quantity: c.qty } });
    }
  }

  // images
  try {
    const files = fd.getAll("images").filter((x): x is File => x instanceof File && x.size > 0);
    const existing = await db.select().from(schema.boxImages).where(eq(schema.boxImages.boxId, boxId));
    let order = existing.length;
    for (const file of files) {
      const url = await saveImage(file, "boxes");
      if (url) await db.insert(schema.boxImages).values({ boxId, url, alt: f.name, sortOrder: order++ });
    }
  } catch (e) {
    return { error: `Saved, but an image failed: ${(e as Error).message}` };
  }
  const del = fd.getAll("deleteImage").map(Number).filter(Boolean);
  if (del.length) await db.delete(schema.boxImages).where(and(eq(schema.boxImages.boxId, boxId), inArray(schema.boxImages.id, del)));

  revalidatePath("/", "layout");
  if (!id) redirect(`/admin/boxes/${boxId}?saved=1`);
  return { ok: true };
}

export async function duplicateBox(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const [b] = await db.select().from(schema.boxes).where(eq(schema.boxes.id, id));
  if (!b) return;
  const { id: _omit, createdAt: _c, updatedAt: _u, ...rest } = b;
  void _omit; void _c; void _u;
  const [n] = await db.insert(schema.boxes).values({ ...rest, name: `${b.name} (copy)`, slug: `${b.slug}-copy-${Date.now().toString(36)}`, code: null, status: "DRAFT" }).$returningId();
  redirect(`/admin/boxes/${n.id}`);
}
