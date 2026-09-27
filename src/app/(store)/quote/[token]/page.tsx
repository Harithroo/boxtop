import { notFound } from "next/navigation";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { rs, prettyDate } from "@/lib/format";
import { colomboNow, addDays } from "@/lib/delivery";
import { AcceptQuoteForm } from "@/components/CorporateForms";
import { declineQuote } from "@/app/actions/corporate";

export const metadata = { title: "Your quote", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function QuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [q] = await db.select().from(schema.quotes).where(eq(schema.quotes.token, token));
  if (!q || q.status === "REQUESTED") notFound();
  const [lines, slots] = await Promise.all([
    db.select().from(schema.quoteLines).where(eq(schema.quoteLines.quoteId, q.id)).orderBy(asc(schema.quoteLines.id)),
    db.select().from(schema.deliverySlots).where(eq(schema.deliverySlots.active, true)).orderBy(asc(schema.deliverySlots.sortOrder)),
  ]);
  const today = colomboNow().date;
  const expired = q.status === "EXPIRED" || (q.status === "SENT" && !!q.expiresAt && q.expiresAt < today);
  const subtotal = lines.reduce((t, l) => t + l.unitPrice * l.quantity, 0);
  const total = subtotal - q.discount + q.deliveryFee;
  let orderNumber: string | null = null;
  if (q.orderId) orderNumber = (await db.select({ n: schema.orders.number }).from(schema.orders).where(eq(schema.orders.id, q.orderId)))[0]?.n ?? null;
  return (
    <div className="container-bt max-w-3xl py-8">
      <p className="eyebrow">Quote {q.number}</p>
      <h1 className="h1">{q.company ?? q.contactName}</h1>
      {q.expiresAt && q.status === "SENT" && <p className="mt-1 text-ink-muted">Valid until {prettyDate(q.expiresAt)} {q.expiresAt.slice(0, 4)}</p>}
      <section className="card mt-6 p-5">
        <ul className="divide-y divide-line text-sm">
          {lines.map((l) => <li key={l.id} className="flex justify-between gap-3 py-2"><span>{l.quantity} × {l.name} <span className="hint">at {rs(l.unitPrice)}</span></span><span>{rs(l.unitPrice * l.quantity)}</span></li>)}
          {q.discount > 0 && <li className="flex justify-between py-2"><span>Discount</span><span>−{rs(q.discount)}</span></li>}
          <li className="flex justify-between py-2"><span>Delivery</span><span>{q.deliveryFee ? rs(q.deliveryFee) : "Included"}</span></li>
          <li className="flex justify-between py-2 font-bold"><span>Total</span><span className="price">{rs(total)}</span></li>
        </ul>
        {q.notes && <p className="mt-3 whitespace-pre-line rounded-md bg-surface-alt p-3 text-sm">{q.notes}</p>}
      </section>
      <div className="mt-6">
        {q.status === "ACCEPTED" ? <p className="rounded-md bg-brand-soft p-4">Accepted, thank you. {orderNumber && <Link href={`/order/${orderNumber}`} className="font-bold text-brand">View order {orderNumber}</Link>}</p>
          : q.status === "DECLINED" ? <p className="text-ink-muted">You declined this quote. Message us if you&apos;d like a new one.</p>
          : expired ? <p className="text-ink-muted">This quote has expired. Ask us for an updated one.</p>
          : (
            <>
              <AcceptQuoteForm token={token} slots={slots.map((s) => ({ id: s.id, label: s.label }))} minDate={q.neededBy && q.neededBy > today ? addDays(today, 1) : addDays(today, 1)} />
              <form action={declineQuote} className="mt-3"><input type="hidden" name="token" value={token} /><button className="text-sm text-ink-muted underline">Decline this quote</button></form>
            </>
          )}
      </div>
    </div>
  );
}
