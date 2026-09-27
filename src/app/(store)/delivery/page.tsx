import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getZones } from "@/lib/delivery";
import { rs, prettyDate } from "@/lib/format";
export const metadata = { title: "Delivery information" };
export const dynamic = "force-dynamic";
export default async function Delivery() {
  const [zones, slots, blackouts] = await Promise.all([
    getZones(),
    db.select().from(schema.deliverySlots).where(eq(schema.deliverySlots.active, true)).orderBy(asc(schema.deliverySlots.sortOrder)),
    db.select().from(schema.blackoutDates).orderBy(asc(schema.blackoutDates.date)),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="container-bt max-w-3xl py-8">
      <h1 className="h1">Delivery</h1>
      <p className="mt-2 text-ink-muted">Every box is packed in Piliyandala. Pick your date and time slot at checkout.</p>
      <h2 className="h2 mt-8 mb-3">Areas and fees</h2>
      <div className="overflow-x-auto rounded-lg bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-alt"><tr><th className="p-3">Area</th><th className="p-3">Fee</th><th className="p-3">Earliest</th></tr></thead>
          <tbody className="divide-y divide-line">
            {zones.map((z) => <tr key={z.id}><td className="p-3"><b>{z.name}</b><br /><span className="hint">{z.cities.split(",").slice(0, 8).join(", ")}{z.cities.split(",").length > 8 && "…"}</span></td><td className="p-3">{rs(z.fee)}</td><td className="p-3">{z.sameDay ? "Same day" : z.leadDays ? `${z.leadDays} days` : "Next day"}</td></tr>)}
          </tbody>
        </table>
      </div>
      <h2 className="h2 mt-8 mb-3">Time slots</h2>
      <ul className="space-y-1 text-sm">{slots.map((s) => <li key={s.id}><b>{s.label}</b> · same-day orders by {s.cutoff}</li>)}</ul>
      {blackouts.filter((b) => b.date >= today).length > 0 && (<><h2 className="h2 mt-8 mb-3">No deliveries on</h2><ul className="space-y-1 text-sm">{blackouts.filter((b) => b.date >= today).map((b) => <li key={b.id}>{prettyDate(b.date)}: {b.reason}</li>)}</ul></>)}
    </div>
  );
}
