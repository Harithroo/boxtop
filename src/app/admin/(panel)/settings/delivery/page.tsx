import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { CrudTable } from "@/components/admin/CrudTable";
import { prettyDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireAdmin();
  const [zones, slots, blackouts] = await Promise.all([
    db.select().from(schema.deliveryZones).orderBy(asc(schema.deliveryZones.sortOrder)),
    db.select().from(schema.deliverySlots).orderBy(asc(schema.deliverySlots.sortOrder)),
    db.select().from(schema.blackoutDates).orderBy(asc(schema.blackoutDates.date)),
  ]);
  return (
    <div className="space-y-5">
      <h1 className="h1">Delivery</h1>
      <p className="hint">Customers pick a city; the city&apos;s zone sets the fee, whether same-day and COD are allowed, and the minimum lead time. Slots apply to every zone.</p>
      <CrudTable entity="deliveryZones" rows={zones.map((z) => ({ ...z, _label: `${z.name} · Rs. ${z.fee} · ${z.cities.split(",").length} cities${z.sameDay ? " · same day" : ""}${z.codAllowed ? " · COD" : ""}${z.active ? "" : " · off"}` }))} />
      <CrudTable entity="deliverySlots" rows={slots.map((s) => ({ ...s, _label: `${s.label} · order by ${s.cutoff} · ${s.capacity} per day${s.active ? "" : " · off"}` }))} />
      <CrudTable entity="blackoutDates" rows={blackouts.map((b) => ({ ...b, _label: `${prettyDate(b.date)} ${b.date.slice(0, 4)} · ${b.reason}` }))} />
    </div>
  );
}
