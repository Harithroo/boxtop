import { asc, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { colomboNow } from "@/lib/delivery";
import { ManualOrderForm } from "@/components/admin/ManualOrderForm";

export default async function NewOrder() {
  await requireAdmin();
  const [boxes, zones, slots] = await Promise.all([
    db.select().from(schema.boxes).where(ne(schema.boxes.status, "ARCHIVED")).orderBy(asc(schema.boxes.name)),
    db.select().from(schema.deliveryZones).orderBy(asc(schema.deliveryZones.sortOrder)),
    db.select().from(schema.deliverySlots).orderBy(asc(schema.deliverySlots.sortOrder)),
  ]);
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="h1">Manual order</h1>
      <p className="hint">For orders taken on WhatsApp, Messenger or the phone. The customer gets the same updates as a website order.</p>
      <ManualOrderForm boxes={boxes.map((b) => ({ id: b.id, name: b.name, code: b.code, price: b.price }))} zones={zones} slots={slots} today={colomboNow().date} />
    </div>
  );
}
