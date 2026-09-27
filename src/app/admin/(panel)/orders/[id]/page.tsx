import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { MessageCircle, Printer } from "lucide-react";
import { db, schema } from "@/db";
import { loadOrder } from "@/db/loaders";
import { requireAdmin } from "@/lib/auth";
import { getSettings, EVENTS } from "@/lib/settings";
import { prettyDate, rs, STATUS_LABEL, waLink } from "@/lib/format";
import { NEXT_STATUS, orderContext } from "@/lib/orders";
import { messageFor } from "@/lib/notify";
import { changeStatus, confirmPayment, updateDelivery, addNote, resendNotification } from "@/app/actions/admin-orders";
import { StatusPill } from "@/components/admin/StatusPill";
import { confirmBulkPayment } from "@/app/actions/admin-extra";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  const o = await loadOrder(eq(schema.orders.id, id));
  if (!o) notFound();
  const [s, slots, ctx] = await Promise.all([
    getSettings(),
    db.select().from(schema.deliverySlots).orderBy(asc(schema.deliverySlots.sortOrder)),
    orderContext(o.id),
  ]);
  const pay = o.payments[0];
  const next = NEXT_STATUS[o.status];
  const statusEvent = ({ PENDING: "order_placed", CONFIRMED: "order_confirmed", PACKED: "order_packed", DISPATCHED: "order_dispatched", DELIVERED: "order_delivered", CANCELLED: "order_cancelled" } as const)[o.status as "PENDING"];
  const waMsg = statusEvent && ctx ? messageFor(statusEvent, "customer", ctx, s) : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/orders" className="text-sm text-brand">← Orders</Link>
        <h1 className="h1">{o.number}</h1><StatusPill s={o.status} />
        {o.bulkRef && <Link href={`/admin/orders?q=${o.bulkRef}`} className="badge bg-brand">Bulk {o.bulkRef}</Link>}
        <span className="hint">{o.source.toLowerCase()} · {o.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Colombo" })}</span>
        <Link href={`/admin/print/${o.id}`} target="_blank" className="btn-outline btn-sm ml-auto"><Printer size={16} /> Packing slip</Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {next && (
          <form action={changeStatus}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value={next} /><button className="btn-primary">Mark {STATUS_LABEL[next].toLowerCase()}</button></form>
        )}
        {waMsg && (
          <a href={waLink(o.customer.phone, waMsg)} target="_blank" rel="noopener" className="btn border border-[#1E7A4C] bg-surface text-[#1E7A4C]"><MessageCircle size={18} /> Send update on WhatsApp</a>
        )}
        {!["CANCELLED", "REFUNDED", "DELIVERED"].includes(o.status) && (
          <form action={changeStatus}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value="CANCELLED" /><button className="btn-outline text-accent-text">Cancel order</button></form>
        )}
        {o.status === "CANCELLED" && pay?.status === "PAID" && (
          <form action={changeStatus}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value="REFUNDED" /><button className="btn-outline">Mark refunded</button></form>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="h2 mb-3">Items</h2>
            <ul className="divide-y divide-line text-sm">
              {o.lines.map((l) => <li key={l.id} className="flex justify-between gap-3 py-2"><span>{l.quantity} × {l.name}{l.meta?.items && <span className="hint block">{l.meta.items.map((i) => `${i.qty} × ${i.name}`).join(", ")}</span>}</span><span>{rs(l.unitPrice * l.quantity)}</span></li>)}
              <li className="flex justify-between py-2"><span>Delivery</span><span>{rs(o.deliveryFee)}</span></li>
              {o.discount > 0 && <li className="flex justify-between py-2"><span>Discount ({o.couponCode})</span><span>−{rs(o.discount)}</span></li>}
              <li className="flex justify-between py-2 font-bold"><span>Total</span><span>{rs(o.total)}</span></li>
              {o.voucherAmount > 0 && <li className="flex justify-between py-2"><span>Paid by voucher {o.voucherCode}</span><span>−{rs(o.voucherAmount)}</span></li>}
            </ul>
            {o.giftMessage && <p className="mt-3 rounded-md bg-accent-soft p-3 text-sm"><b>Card message:</b> {o.giftMessage}</p>}
            {o.customerNote && <p className="mt-2 rounded-md bg-surface-alt p-3 text-sm"><b>Customer note:</b> {o.customerNote}</p>}
            <div className="mt-2 flex gap-2 text-xs">{o.surprise && <span className="badge">Keep it a surprise</span>}{o.callToArrange && <span className="badge bg-brand">Call recipient to arrange</span>}</div>
          </section>

          <section className="card p-5">
            <h2 className="h2 mb-3">Delivery</h2>
            <p className="text-sm"><b>{o.recipient.name}</b> · <a href={`tel:+${o.recipient.phone}`} className="text-brand">+{o.recipient.phone}</a><br />{o.recipient.address}, {o.recipient.city}{o.recipient.notes && <><br /><span className="hint">{o.recipient.notes}</span></>}</p>
            {o.delivery && (
              <form action={updateDelivery} className="mt-4 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={o.id} />
                <div><label className="label">Date</label><input type="date" name="date" defaultValue={o.delivery.date} className="input" /></div>
                <div><label className="label">Slot</label><select name="slotId" defaultValue={o.delivery.slotId ?? ""} className="input">{slots.map((sl) => <option key={sl.id} value={sl.id}>{sl.label}</option>)}</select></div>
                <div><label className="label">Rider or courier</label><input name="carrier" defaultValue={o.delivery.carrier ?? ""} className="input" placeholder="Kasun / Pronto" /></div>
                <div><label className="label">Tracking no.</label><input name="tracking" defaultValue={o.delivery.tracking ?? ""} className="input" /></div>
                <div className="sm:col-span-2"><label className="label">Delivery photo</label><input type="file" name="photo" accept="image/*" capture="environment" className="input py-2" /></div>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <button className="btn-outline">Save delivery</button>
                  {o.status !== "DELIVERED" && <button name="markDelivered" value="1" className="btn-primary">Save and mark delivered</button>}
                </div>
                <p className="hint sm:col-span-2">Zone: {o.delivery.zone?.name ?? "–"} · {prettyDate(o.delivery.date)} {o.delivery.slot?.label}</p>
              </form>
            )}
            {o.delivery?.photo && <div className="relative mt-3 aspect-[4/3] w-64 overflow-hidden rounded-md"><Image src={o.delivery.photo} alt="Delivery" fill className="object-cover" unoptimized /></div>}
          </section>

          <section className="card p-5">
            <h2 className="h2 mb-3">Activity</h2>
            <form action={addNote} className="mb-3 flex gap-2"><input type="hidden" name="id" value={o.id} /><input name="note" className="input" placeholder="Add a note" /><button className="btn-outline">Add</button></form>
            <ul className="space-y-2 text-sm">
              {o.events.map((e) => <li key={e.id}><span className="hint">{e.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Colombo", dateStyle: "short", timeStyle: "short" })}</span> · {e.message}</li>)}
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card p-5 text-sm">
            <h2 className="h2 mb-2">Customer</h2>
            <p><b>{o.customer.name}</b><br /><a href={`tel:+${o.customer.phone}`} className="text-brand">+{o.customer.phone}</a>{o.customer.email && <><br />{o.customer.email}</>}</p>
            <a href={waLink(o.customer.phone, `Hi ${o.customer.name}, this is Boxtop about your order ${o.number}.`)} target="_blank" rel="noopener" className="mt-2 inline-block font-bold text-[#1E7A4C]">WhatsApp customer</a>
          </section>
          {pay && (
            <section className="card p-5 text-sm">
              <h2 className="h2 mb-2">Payment</h2>
              <p>{pay.method === "COD" ? "Cash on delivery" : pay.method === "VOUCHER" ? "Gift voucher" : "Bank transfer"} · <b>{pay.status.replace("_", " ").toLowerCase()}</b> · {rs(pay.amount)}</p>
              {o.bulkRef && pay.status !== "PAID" && <form action={confirmBulkPayment} className="mt-2"><input type="hidden" name="ref" value={o.bulkRef} /><button className="btn-primary btn-sm">Mark whole bulk order {o.bulkRef} paid</button></form>}
              {pay.slip && <a href={pay.slip} target="_blank" className="relative mt-3 block aspect-[3/4] w-full overflow-hidden rounded-md border border-line"><Image src={pay.slip} alt="Bank slip" fill className="object-contain" unoptimized /></a>}
              {pay.status !== "PAID" && (
                <div className="mt-3 flex gap-2">
                  <form action={confirmPayment}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="paid" value="1" /><button className="btn-primary btn-sm">Mark paid</button></form>
                  {pay.status === "SLIP_UPLOADED" && <form action={confirmPayment}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="paid" value="0" /><button className="btn-outline btn-sm">Reject slip</button></form>}
                </div>
              )}
            </section>
          )}
          <section className="card p-5 text-sm">
            <h2 className="h2 mb-2">Resend a notification</h2>
            <form action={resendNotification} className="flex gap-2">
              <input type="hidden" name="id" value={o.id} />
              <select name="event" className="input min-h-10 py-1 text-sm">{Object.entries(EVENTS).filter(([k]) => k.startsWith("order")).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              <button className="btn-outline btn-sm">Send</button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
