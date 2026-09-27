import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSettings } from "@/lib/settings";
import { rs, prettyDate, STATUS_LABEL } from "@/lib/format";
import { BankDetails } from "@/components/BankDetails";
import { BulkSlipForm } from "@/components/CorporateForms";

export const metadata = { title: "Bulk order", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function BulkPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  if ((await cookies()).get(`bt_b_${ref}`)?.value !== "1") redirect("/track");
  const orders = await db.select({ o: schema.orders, to: schema.recipients.name, city: schema.recipients.city, date: schema.deliveries.date })
    .from(schema.orders).innerJoin(schema.recipients, eq(schema.recipients.id, schema.orders.recipientId)).leftJoin(schema.deliveries, eq(schema.deliveries.orderId, schema.orders.id))
    .where(eq(schema.orders.bulkRef, ref)).orderBy(asc(schema.orders.id));
  if (!orders.length) notFound();
  const pays = await db.select().from(schema.payments).where(inArray(schema.payments.orderId, orders.map((x) => x.o.id)));
  const total = pays.reduce((t, p) => t + p.amount, 0);
  const allPaid = pays.every((p) => p.status === "PAID");
  const slipIn = pays.some((p) => p.status === "SLIP_UPLOADED");
  const s = await getSettings();
  return (
    <div className="container-bt max-w-3xl py-8">
      <p className="eyebrow">Bulk order {ref}</p>
      <h1 className="h1">{orders.length} deliveries on {orders[0].date ? prettyDate(orders[0].date) : "your date"}</h1>
      {!allPaid && (
        <section className="card mt-6 space-y-3 p-5">
          <h2 className="h2">Pay by bank transfer</h2>
          <p className="text-sm">{s.payments.bank.instructions}</p>
          <BankDetails accounts={s.payments.bank.accounts} amount={total} reference={ref} />
          {slipIn ? <p className="rounded-md bg-brand-soft p-3 text-sm">Slip received. We&apos;ll confirm the order shortly.</p> : <BulkSlipForm refCode={ref} />}
        </section>
      )}
      <section className="card mt-6 p-5">
        <div className="mb-2 flex justify-between"><h2 className="h2">Deliveries</h2><span className="price">{rs(total)}</span></div>
        <ul className="divide-y divide-line text-sm">
          {orders.map(({ o, to, city }) => <li key={o.id} className="flex flex-wrap justify-between gap-2 py-2"><span><b>{o.number}</b> · {to}, {city}</span><span>{rs(o.total)} · {STATUS_LABEL[o.status]}</span></li>)}
        </ul>
      </section>
    </div>
  );
}
