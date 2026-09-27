import Link from "next/link";
import { and, eq, gte, lte, notInArray, sql, isNotNull, count } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { colomboNow, addDays } from "@/lib/delivery";
import { rs, prettyDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await requireAdmin();
  const today = colomboNow().date;
  const weekAgo = new Date(new Date(`${today}T00:00:00+05:30`).getTime() - 6 * 86400000);
  const live = notInArray(schema.orders.status, ["CANCELLED", "REFUNDED"]);

  const [todayRows, toConfirm, slips, toPack, lowStock, week, newEnq] = await Promise.all([
    db.select({ slot: schema.deliverySlots.label, status: schema.orders.status, n: count() })
      .from(schema.deliveries).innerJoin(schema.orders, eq(schema.orders.id, schema.deliveries.orderId))
      .leftJoin(schema.deliverySlots, eq(schema.deliverySlots.id, schema.deliveries.slotId))
      .where(and(eq(schema.deliveries.date, today), live)).groupBy(schema.deliverySlots.label, schema.orders.status),
    db.select({ n: count() }).from(schema.orders).where(eq(schema.orders.status, "PENDING")),
    db.select({ n: count() }).from(schema.payments).where(eq(schema.payments.status, "SLIP_UPLOADED")),
    db.select({ n: count() }).from(schema.orders).innerJoin(schema.deliveries, eq(schema.deliveries.orderId, schema.orders.id))
      .where(and(eq(schema.orders.status, "CONFIRMED"), lte(schema.deliveries.date, addDays(today, 1)))),
    db.select({ id: schema.boxes.id, name: schema.boxes.name, stock: schema.boxes.stock }).from(schema.boxes)
      .where(and(eq(schema.boxes.status, "ACTIVE"), isNotNull(schema.boxes.stock), lte(schema.boxes.stock, 3))),
    db.select({ n: count(), total: sql<number>`coalesce(sum(${schema.orders.total}),0)` }).from(schema.orders)
      .where(and(live, gte(schema.orders.createdAt, weekAgo))),
    db.select({ n: count() }).from(schema.enquiries).where(eq(schema.enquiries.status, "new")),
  ]);
  const [[quotesNew], [reviewsWaiting], [vouchersPending]] = await Promise.all([
    db.select({ n: count() }).from(schema.quotes).where(eq(schema.quotes.status, "REQUESTED")),
    db.select({ n: count() }).from(schema.reviews).where(eq(schema.reviews.approved, false)),
    db.select({ n: count() }).from(schema.vouchers).where(eq(schema.vouchers.status, "PENDING")),
  ]);

  const bySlot = new Map<string, { total: number; delivered: number }>();
  for (const r of todayRows) {
    const k = r.slot ?? "No slot";
    const v = bySlot.get(k) ?? { total: 0, delivered: 0 };
    v.total += r.n; if (r.status === "DELIVERED") v.delivered += r.n;
    bySlot.set(k, v);
  }

  const tiles = [
    ["Waiting to confirm", toConfirm[0].n, "/admin/orders?status=PENDING"],
    ["Bank slips to check", slips[0].n, "/admin/orders?payment=SLIP_UPLOADED"],
    ["To pack (today and tomorrow)", toPack[0].n, `/admin/deliveries?date=${today}`],
    ["New enquiries", newEnq[0].n, "/admin/enquiries"],
    ["Quote requests", quotesNew.n, "/admin/quotes"],
    ["Reviews to approve", reviewsWaiting.n, "/admin/reviews"],
    ["Vouchers to activate", vouchersPending.n, "/admin/vouchers"],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h1">Today · {prettyDate(today)}</h1>
        <Link href="/admin/orders/new" className="btn-primary btn-sm">+ Manual order</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        {tiles.map(([l, n, h]) => (
          <Link key={l} href={h} className="card p-4 hover:shadow-[var(--shadow-raised)]">
            <p className="hint">{l}</p><p className={`font-[family-name:var(--font-display)] text-3xl font-semibold ${n ? "text-brand" : ""}`}>{n}</p>
          </Link>
        ))}
      </div>
      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between"><h2 className="h2">Deliveries today</h2><Link href={`/admin/deliveries?date=${today}`} className="text-sm font-bold text-brand">Open board</Link></div>
        {bySlot.size === 0 ? <p className="hint">No deliveries today.</p> : (
          <ul className="divide-y divide-line">
            {[...bySlot].map(([slot, v]) => <li key={slot} className="flex justify-between py-2 text-sm"><span>{slot}</span><span><b>{v.delivered}</b> / {v.total} delivered</span></li>)}
          </ul>
        )}
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-5"><h2 className="h2 mb-2">Last 7 days</h2><p className="price text-2xl">{rs(Number(week[0].total))}</p><p className="hint">{week[0].n} orders</p></section>
        <section className="card p-5">
          <h2 className="h2 mb-2">Low stock</h2>
          {lowStock.length === 0 ? <p className="hint">Nothing low.</p> : <ul className="text-sm">{lowStock.map((b) => <li key={b.id}><Link href={`/admin/boxes/${b.id}`} className="text-brand">{b.name}</Link>: {b.stock} left</li>)}</ul>}
        </section>
      </div>
    </div>
  );
}
