import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { CrudTable } from "@/components/admin/CrudTable";
export const dynamic = "force-dynamic";
export default async function Builder() {
  await requireAdmin();
  const [sizes, items, makers, styles] = await Promise.all([
    db.select().from(schema.builderSizes).orderBy(asc(schema.builderSizes.sortOrder)),
    db.select().from(schema.items).orderBy(asc(schema.items.sortOrder), asc(schema.items.name)),
    db.select().from(schema.makers).orderBy(asc(schema.makers.name)),
    db.select().from(schema.boxStyles).orderBy(asc(schema.boxStyles.sortOrder)),
  ]);
  const rs = (n: number | null) => (n == null ? "–" : `Rs ${n.toLocaleString("en-US")}`);
  return (
    <div className="space-y-5">
      <h1 className="h1">Build-your-own and items</h1>
      <p className="hint max-w-2xl">The home page builder offers every item marked &ldquo;In the builder&rdquo; and ends in a WhatsApp quote. Give items a builder price and the /build page sells built boxes outright: a size&apos;s base price plus each item&apos;s builder price. Items are also what box contents are made of, and their stock goes down when a built box is ordered.</p>
      <CrudTable entity="boxStyles" rows={styles.map((x) => ({ ...x, _label: `${x.name} · ${x.outer} outside, ${x.inner} inside${x.active ? "" : " · off"}` }))} />
      <CrudTable entity="builderSizes" rows={sizes.map((s) => ({ ...s, _label: `${s.name} · up to ${s.capacity} items · base ${rs(s.basePrice)}${s.allowedItems ? " · limited items" : ""}${s.active ? "" : " · off"}` }))} />
      <CrudTable entity="items" rows={items.map((i) => ({ ...i, _label: `#${i.id} ${i.name}${i.size ? ` (${i.size})` : ""}${i.builderEnabled ? ` · builder ${rs(i.builderPrice)}` : ""} · stock ${i.stock ?? "–"}${makers.find((m) => m.id === i.makerId) ? ` · ${makers.find((m) => m.id === i.makerId)!.name}` : ""}` }))} />
      <CrudTable entity="makers" rows={makers.map((m) => ({ ...m, _label: `#${m.id} ${m.name}${m.place ? ` · ${m.place}` : ""}` }))} />
    </div>
  );
}
