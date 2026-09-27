import Link from "next/link";
import { and, desc, eq, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentCustomer } from "@/lib/customer-auth";
import { signOut, updateEmail } from "@/app/actions/account";
import { AccountSignIn } from "@/components/AccountSignIn";
import { prettyDate, rs, STATUS_LABEL } from "@/lib/format";

export const metadata = { title: "Your account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Account() {
  const c = await currentCustomer();
  if (!c) return <div className="container-bt py-8"><h1 className="h1 mb-2">Your account</h1><p className="mb-6 text-ink-muted">See your orders, save recipients and set gift reminders.</p><AccountSignIn /></div>;
  const [orders, recipients] = await Promise.all([
    db.select({ o: schema.orders, date: schema.deliveries.date, to: schema.recipients.name }).from(schema.orders)
      .leftJoin(schema.deliveries, eq(schema.deliveries.orderId, schema.orders.id)).innerJoin(schema.recipients, eq(schema.recipients.id, schema.orders.recipientId))
      .where(c.via.includes("@") ? and(eq(schema.orders.customerId, c.id), eq(schema.orders.contactEmail, c.via)) : eq(schema.orders.customerId, c.id)).orderBy(desc(schema.orders.id)).limit(50),
    c.via.includes("@") ? Promise.resolve([] as (typeof schema.recipients.$inferSelect)[]) : db.select().from(schema.recipients).where(or(eq(schema.recipients.customerId, c.id))).orderBy(desc(schema.recipients.id)).limit(40),
  ]);
  const uniq = [...new Map(recipients.map((r) => [`${r.name}|${r.address}`, r])).values()].slice(0, 12);
  return (
    <div className="container-bt py-8">
      <div className="flex flex-wrap items-center gap-3"><h1 className="h1 mr-auto">Hi {c.name.split(" ")[0]}</h1><Link href="/account/reminders" className="btn-outline btn-sm">Gift reminders</Link><form action={signOut}><button className="btn-sm btn text-brand">Sign out</button></form></div>
      {!c.email && (
        <form action={updateEmail} className="card mt-4 flex flex-wrap items-end gap-2 p-4">
          <div className="flex-1"><label className="label">Add your email for order updates and reminders</label><input name="email" type="email" className="input" required /></div>
          <button className="btn-primary btn-sm">Save</button>
        </form>
      )}
      <section className="mt-6">
        <h2 className="h2 mb-3">Your orders</h2>
        {orders.length === 0 ? <p className="text-ink-muted">No orders yet. <Link href="/shop" className="font-bold text-brand">Find a box</Link>.</p> : (
          <ul className="divide-y divide-line rounded-lg bg-surface">
            {orders.map(({ o, date, to }) => (
              <li key={o.id} className="flex flex-wrap items-center gap-2 p-4 text-sm">
                <Link href={`/order/${o.number}`} className="font-bold text-brand">{o.number}</Link><span>to {to}</span>
                {date && <span className="hint">{prettyDate(date)}</span>}
                <span className="ml-auto">{rs(o.total)} · {STATUS_LABEL[o.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {uniq.length > 0 && (
        <section className="mt-8">
          <h2 className="h2 mb-3">People you&apos;ve sent to</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {uniq.map((r) => <div key={r.id} className="card p-4 text-sm"><b>{r.name}</b><br />{r.address}, {r.city}<br /><span className="hint">+{r.phone}</span></div>)}
          </div>
        </section>
      )}
    </div>
  );
}
