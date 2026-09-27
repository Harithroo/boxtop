import Link from "next/link";
import { and, asc, eq, inArray, notInArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { colomboNow, addDays } from "@/lib/delivery";
import { prettyDate } from "@/lib/format";
import { StatusPill } from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";

export default async function Deliveries({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requireAdmin();
  const date = (await searchParams).date ?? colomboNow().date;
  const [slots, rows] = await Promise.all([
    db.select().from(schema.deliverySlots).orderBy(asc(schema.deliverySlots.sortOrder)),
    db.select({ id: schema.orders.id, number: schema.orders.number, status: schema.orders.status, slotId: schema.deliveries.slotId, carrier: schema.deliveries.carrier,
      recipient: schema.recipients.name, city: schema.recipients.city, zone: schema.deliveryZones.name })
      .from(schema.deliveries).innerJoin(schema.orders, eq(schema.orders.id, schema.deliveries.orderId))
      .innerJoin(schema.recipients, eq(schema.recipients.id, schema.orders.recipientId))
      .leftJoin(schema.deliveryZones, eq(schema.deliveryZones.id, schema.deliveries.zoneId))
      .where(and(eq(schema.deliveries.date, date), notInArray(schema.orders.status, ["CANCELLED", "REFUNDED"]))),
  ]);
  const lines = rows.length ? await db.select().from(schema.orderLines).where(inArray(schema.orderLines.orderId, rows.map((r) => r.id))) : [];
  const pick = new Map<string, number>();
  for (const l of lines) pick.set(l.name, (pick.get(l.name) ?? 0) + l.quantity);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="h1 mr-auto">Deliveries · {prettyDate(date)}</h1>
        <Link href={`?date=${addDays(date, -1)}`} className="btn-outline btn-sm">← Prev</Link>
        <form><input type="date" name="date" defaultValue={date} className="input min-h-9 py-1 text-sm" /></form>
        <Link href={`?date=${addDays(date, 1)}`} className="btn-outline btn-sm">Next →</Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {[...slots, { id: 0, label: "No slot", capacity: 0 }].map((sl) => {
            const list = rows.filter((r) => (r.slotId ?? 0) === sl.id);
            if (!list.length && sl.id === 0) return null;
            return (
              <section key={sl.id} className="card p-4">
                <div className="mb-2 flex justify-between"><h2 className="font-bold">{sl.label}</h2>{sl.capacity > 0 && <span className="hint">{list.length} / {sl.capacity}</span>}</div>
                {list.length === 0 ? <p className="hint">Nothing booked.</p> : (
                  <ul className="divide-y divide-line text-sm">
                    {list.map((r) => (
                      <li key={r.id} className="flex flex-wrap items-center gap-2 py-2">
                        <Link href={`/admin/orders/${r.id}`} className="font-bold text-brand">{r.number}</Link>
                        <span>{r.recipient}, {r.city}</span><span className="hint">{r.zone}</span>
                        <span className="ml-auto flex items-center gap-2">{r.carrier && <span className="hint">{r.carrier}</span>}<StatusPill s={r.status} /></span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
        <aside className="card h-fit p-4">
          <h2 className="mb-2 font-bold">Pick list</h2>
          {pick.size === 0 ? <p className="hint">Nothing to pack.</p> : <ul className="text-sm">{[...pick].sort().map(([n, q]) => <li key={n} className="flex justify-between py-1"><span>{n}</span><b>{q}</b></li>)}</ul>}
        </aside>
      </div>
      <script dangerouslySetInnerHTML={{ __html: "document.querySelector('input[name=date]')?.addEventListener('change',e=>e.target.form.submit())" }} />
    </div>
  );
}
