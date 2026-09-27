import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { MessageCircle } from "lucide-react";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { prettyDate, waLink } from "@/lib/format";
import { addDays, colomboNow } from "@/lib/delivery";
import { QuoteEditor } from "@/components/admin/QuoteEditor";
import { setQuoteStatus } from "@/app/actions/admin-extra";

export const dynamic = "force-dynamic";

export default async function QuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  const [q] = await db.select().from(schema.quotes).where(eq(schema.quotes.id, id));
  if (!q) notFound();
  const [lines, boxes, tiers] = await Promise.all([
    db.select().from(schema.quoteLines).where(eq(schema.quoteLines.quoteId, id)).orderBy(asc(schema.quoteLines.id)),
    db.select().from(schema.boxes).orderBy(asc(schema.boxes.name)),
    db.select().from(schema.priceTiers).orderBy(asc(schema.priceTiers.minQty)),
  ]);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://box-top.lk";
  const link = `${site}/quote/${q.token}`;
  let orderNumber: string | null = null;
  if (q.orderId) orderNumber = (await db.select({ n: schema.orders.number }).from(schema.orders).where(eq(schema.orders.id, q.orderId)))[0]?.n ?? null;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/quotes" className="text-sm text-brand">← Quotes</Link>
        <h1 className="h1">{q.number}</h1><span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand">{q.status.toLowerCase()}</span>
        {q.status === "ACCEPTED" && q.orderId && <Link href={`/admin/orders/${q.orderId}`} className="btn-primary btn-sm ml-auto">Open order {orderNumber}</Link>}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <QuoteEditor quoteId={q.id} locked={q.status === "ACCEPTED"}
          boxes={boxes.map((b) => ({ id: b.id, name: b.name, price: b.price, tiers: tiers.filter((t) => t.boxId === b.id).map((t) => ({ minQty: t.minQty, unitPrice: t.unitPrice })) }))}
          initial={lines.map((l) => ({ boxId: l.boxId ?? 0, name: l.boxId && boxes.find((b) => b.id === l.boxId)?.name === l.name ? "" : l.name, qty: l.quantity, price: l.unitPrice }))}
          deliveryFee={q.deliveryFee} discount={q.discount} notes={q.notes ?? ""} expiresAt={q.expiresAt ?? addDays(colomboNow().date, 14)} />
        <aside className="space-y-4">
          <section className="card p-4 text-sm">
            <h2 className="mb-2 font-bold">Request</h2>
            <p><b>{q.contactName}</b>{q.company && ` · ${q.company}`}<br /><a href={`tel:+${q.phone}`} className="text-brand">+{q.phone}</a>{q.email && <><br />{q.email}</>}</p>
            <p className="mt-2">{[q.quantity && `${q.quantity} boxes`, q.budget, q.neededBy && `needed ${prettyDate(q.neededBy)}`, q.branding].filter(Boolean).join(" · ")}</p>
            <p className="mt-2 whitespace-pre-line">{q.request}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {q.photo && <a href={q.photo} target="_blank"><img src={q.photo} alt="" className="mt-2 h-24 rounded object-cover" /></a>}
          </section>
          {q.status !== "REQUESTED" && (
            <section className="card space-y-2 p-4 text-sm">
              <h2 className="font-bold">Customer link</h2>
              <p className="break-all text-brand">{link}</p>
              <a href={waLink(q.phone, `Hi ${q.contactName}, here is your Boxtop quote ${q.number}: ${link}`)} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-bold text-[#1E7A4C]"><MessageCircle size={16} /> Send on WhatsApp</a>
            </section>
          )}
          {!["ACCEPTED"].includes(q.status) && (
            <form action={setQuoteStatus} className="flex gap-2"><input type="hidden" name="id" value={q.id} />
              <select name="status" defaultValue={q.status} className="input min-h-9 py-1 text-sm"><option value="REQUESTED">New request</option><option value="SENT">Sent</option><option value="DECLINED">Declined</option><option value="EXPIRED">Expired</option></select>
              <button className="btn-outline btn-sm">Set</button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
