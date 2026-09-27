import { asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { colomboNow, addDays } from "@/lib/delivery";
import { BulkOrderForm } from "@/components/CorporateForms";

export const metadata = { title: "Bulk order", description: "Send one gift box to many addresses across Sri Lanka with a single order." };
export const dynamic = "force-dynamic";

export default async function Bulk() {
  const boxes = await db.select().from(schema.boxes).where(eq(schema.boxes.status, "ACTIVE")).orderBy(asc(schema.boxes.sortOrder), asc(schema.boxes.name));
  const tiers = boxes.length ? await db.select().from(schema.priceTiers).where(inArray(schema.priceTiers.boxId, boxes.map((b) => b.id))).orderBy(asc(schema.priceTiers.minQty)) : [];
  const slots = await db.select().from(schema.deliverySlots).where(eq(schema.deliverySlots.active, true)).orderBy(asc(schema.deliverySlots.sortOrder));
  return (
    <div className="container-bt max-w-3xl py-8">
      <p className="eyebrow">Corporate</p>
      <h1 className="h1">Bulk order</h1>
      <p className="mb-6 mt-2 text-ink-muted">One box, many people. Each address gets its own delivery and card.</p>
      <BulkOrderForm boxes={boxes.map((b) => ({ id: b.id, name: b.name, price: b.price, tiers: tiers.filter((t) => t.boxId === b.id).map((t) => ({ minQty: t.minQty, unitPrice: t.unitPrice })) }))}
        slots={slots.map((s) => ({ id: s.id, label: s.label }))} minDate={addDays(colomboNow().date, 2)} />
    </div>
  );
}
