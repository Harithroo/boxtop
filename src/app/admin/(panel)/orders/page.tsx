import Link from "next/link";
import { and, desc, eq, inArray, like, or, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { prettyDate, rs, STATUS_LABEL } from "@/lib/format";
import { StatusPill } from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";

type SP = { status?: string; payment?: string; date?: string; q?: string };

export default async function Orders({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const where: SQL[] = [];
  if (sp.status && sp.status in STATUS_LABEL) where.push(eq(schema.orders.status, sp.status as "PENDING"));
  if (sp.date) where.push(eq(schema.deliveries.date, sp.date));
  if (sp.q) where.push(or(like(schema.orders.number, `%${sp.q}%`), eq(schema.orders.bulkRef, sp.q), like(schema.customers.name, `%${sp.q}%`), like(schema.customers.phone, `%${sp.q.replace(/^0/, "")}%`), like(schema.recipients.name, `%${sp.q}%`))!);
  if (sp.payment === "SLIP_UPLOADED") {
    const ids = (await db.select({ id: schema.payments.orderId }).from(schema.payments).where(eq(schema.payments.status, "SLIP_UPLOADED"))).map((r) => r.id);
    where.push(inArray(schema.orders.id, ids.length ? ids : [0]));
  }
  const rows = await db
    .select({ id: schema.orders.id, number: schema.orders.number, status: schema.orders.status, total: schema.orders.total, source: schema.orders.source, bulk: schema.orders.bulkRef,
      customer: schema.customers.name, recipient: schema.recipients.name, city: schema.recipients.city, date: schema.deliveries.date, slot: schema.deliverySlots.label })
    .from(schema.orders)
    .innerJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
    .innerJoin(schema.recipients, eq(schema.recipients.id, schema.orders.recipientId))
    .leftJoin(schema.deliveries, eq(schema.deliveries.orderId, schema.orders.id))
    .leftJoin(schema.deliverySlots, eq(schema.deliverySlots.id, schema.deliveries.slotId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(schema.orders.id)).limit(200);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="h1">Orders</h1><Link href="/admin/orders/new" className="btn-primary btn-sm">+ Manual order</Link></div>
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Order no, name or phone" className="input min-h-10 w-56 py-1.5 text-sm" />
        <select name="status" defaultValue={sp.status ?? ""} className="input min-h-10 w-40 py-1.5 text-sm"><option value="">Any status</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input type="date" name="date" defaultValue={sp.date} className="input min-h-10 w-44 py-1.5 text-sm" aria-label="Delivery date" />
        <button className="btn-outline btn-sm">Filter</button>
        {(sp.q || sp.status || sp.date || sp.payment) && <Link href="/admin/orders" className="btn-sm btn text-brand">Clear</Link>}
      </form>
      <div className="overflow-x-auto rounded-lg bg-surface shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-alt"><tr>{["Order", "Customer → recipient", "Delivery", "Total", "Status"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-page">
                <td className="p-3"><Link href={`/admin/orders/${r.id}`} className="font-bold text-brand">{r.number}</Link>{r.source !== "WEB" && <span className="hint block">{r.source.toLowerCase()}{r.bulk && ` · ${r.bulk}`}</span>}</td>
                <td className="p-3">{r.customer} → {r.recipient}<span className="hint block">{r.city}</span></td>
                <td className="p-3">{r.date ? prettyDate(r.date) : "–"}<span className="hint block">{r.slot}</span></td>
                <td className="p-3">{rs(r.total)}</td>
                <td className="p-3"><StatusPill s={r.status} /></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="p-6 text-center text-ink-muted">No orders match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
