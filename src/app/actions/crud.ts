"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { SPECS, type Entity, type Field } from "@/lib/crud-spec";
import { slugify } from "@/lib/format";
import { saveImage } from "@/lib/uploads";

const TABLES = {
  collections: schema.collections, addOns: schema.addOns, coupons: schema.coupons, deliveryZones: schema.deliveryZones,
  deliverySlots: schema.deliverySlots, blackoutDates: schema.blackoutDates, pages: schema.pages, faqs: schema.faqs,
  builderSizes: schema.builderSizes, items: schema.items, makers: schema.makers,
} as const;

function coerce(f: Field, raw: FormDataEntryValue | null) {
  const v = raw == null ? "" : String(raw).trim();
  if (f.type === "bool") return raw === "on";
  if (f.type === "number") return v === "" ? (f.required ? 0 : null) : Math.round(Number(v));
  if (f.type === "datetime") return v ? new Date(v) : null;
  return v === "" ? null : v;
}

export type CrudState = { error?: string; ok?: number };

export async function saveRow(_: CrudState, fd: FormData): Promise<CrudState> {
  await requireAdmin();
  const entity = String(fd.get("_entity")) as Entity;
  const spec = SPECS[entity];
  const table = TABLES[entity];
  if (!spec || !table) return { error: "Unknown list" };
  const values: Record<string, unknown> = {};
  for (const f of spec.fields as Field[]) {
    if (f.type === "image") {
      try {
        const url = await saveImage(fd.get(f.name) as File | null, entity === "makers" ? "content" : "items", 1000);
        if (url) values[f.name] = url;
        else if (fd.get(`${f.name}__remove`) === "on") values[f.name] = null;
      } catch (e) { return { error: (e as Error).message }; }
      continue;
    }
    const val = coerce(f, fd.get(f.name));
    if (f.required && (val === null || val === "")) return { error: `${f.label} is required.` };
    values[f.name] = val;
  }
  if (entity === "collections" || entity === "makers") values.slug = slugify(String(values.slug || values.name));
  if (entity === "builderSizes" && values.allowedItems) values.allowedItems = String(values.allowedItems).split(/[\s,]+/).filter((x) => /^\d+$/.test(x)).join(",") || null;
  if (entity === "coupons") values.code = String(values.code).toUpperCase().replace(/\s/g, "");
  if (entity === "coupons" && values.value == null) values.value = 0;
  if ("sortOrder" in values && values.sortOrder == null) values.sortOrder = 0;
  if ("capacity" in values && values.capacity == null) values.capacity = 20;
  if ("leadDays" in values && values.leadDays == null) values.leadDays = 0;
  if ("minSpend" in values && values.minSpend == null) values.minSpend = 0;
  const id = Number(fd.get("_id")) || 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = table as any;
    if (id) await db.update(t).set(values).where(eq(t.id, id));
    else await db.insert(t).values(values);
  } catch (e) {
    const m = String((e as Error).message);
    return { error: m.includes("Duplicate") ? "That already exists." : m.slice(0, 200) };
  }
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

export async function deleteRow(fd: FormData) {
  await requireAdmin();
  const entity = String(fd.get("_entity")) as Entity;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = TABLES[entity] as any;
  if (t) await db.delete(t).where(eq(t.id, Number(fd.get("_id"))));
  revalidatePath("/", "layout");
}
