import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { schema } from "@/db";
import { loadOrder } from "@/db/loaders";
import { requireAdmin } from "@/lib/auth";
import { prettyDate } from "@/lib/format";

export const dynamic = "force-dynamic";

// Packing slip: no prices, card message printed large.
export default async function PackingSlip({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const o = await loadOrder(eq(schema.orders.id, Number((await params).id)));
  if (!o) notFound();
  const cod = o.payments[0]?.method === "COD" && o.payments[0]?.status !== "PAID";
  return (
    <div className="mx-auto max-w-[148mm] bg-white p-6 text-ink print:p-0">
      <script dangerouslySetInnerHTML={{ __html: "window.addEventListener('load',()=>setTimeout(()=>window.print(),300))" }} />
      <div className="flex items-start justify-between border-b-2 border-ink pb-3">
        <div className="flex items-center gap-2">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/brand/logo-192.png" alt="" className="h-14 w-14 rounded" /><div><p className="wordmark">BOXTOP</p><p className="text-xs">taste for gift</p></div></div>
        <div className="text-right"><p className="text-xl font-bold">{o.number}</p>{o.delivery && <p>{prettyDate(o.delivery.date)} · {o.delivery.slot?.label}</p>}</div>
      </div>
      <div className="mt-4">
        <p className="text-xs font-bold uppercase">Deliver to</p>
        <p className="text-lg font-bold">{o.recipient.name} · +{o.recipient.phone}</p>
        <p>{o.recipient.address}, {o.recipient.city}</p>
        {o.recipient.notes && <p className="italic">{o.recipient.notes}</p>}
        <p className="mt-1 font-bold">{o.surprise && "KEEP IT A SURPRISE · "}{o.callToArrange && "CALL TO ARRANGE · "}{cod && `COLLECT CASH Rs. ${o.payments[0].amount.toLocaleString("en-LK")}`}</p>
      </div>
      <div className="mt-4">
        <p className="text-xs font-bold uppercase">Pack</p>
        <ul className="list-inside list-disc">{o.lines.map((l) => <li key={l.id}>{l.quantity} × {l.name}{l.meta?.items && <ul className="ml-6 list-[circle]">{l.meta.items.map((i) => <li key={i.id}>{i.qty} × {i.name}</li>)}</ul>}</li>)}</ul>
        {o.customerNote && <p className="mt-2 italic">Note: {o.customerNote}</p>}
      </div>
      {o.giftMessage && (
        <div className="mt-6 border-t border-dashed border-ink pt-6 text-center">
          <p className="text-xs font-bold uppercase">Card message</p>
          <p className="mt-2 whitespace-pre-line font-[family-name:var(--font-display)] text-2xl">{o.giftMessage}</p>
        </div>
      )}
    </div>
  );
}
