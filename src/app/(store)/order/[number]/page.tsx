import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { eq } from "drizzle-orm";
import { Check, MessageCircle } from "lucide-react";
import { schema } from "@/db";
import { loadOrder } from "@/db/loaders";
import { canView } from "@/app/actions/order";
import { getSettings } from "@/lib/settings";
import { prettyDate, rs, STATUS_LABEL, waLink } from "@/lib/format";
import { SlipUpload } from "@/components/SlipUpload";
import { BankDetails } from "@/components/BankDetails";
import { PushEnable } from "@/components/admin/PushEnable";

export const metadata = { title: "Your order", robots: { index: false } };
export const dynamic = "force-dynamic";

const STEPS = ["PENDING", "CONFIRMED", "PACKED", "DISPATCHED", "DELIVERED"] as const;

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  if (!(await canView(number))) redirect(`/track?order=${number}`);
  const o = await loadOrder(eq(schema.orders.number, number));
  if (!o) notFound();
  const s = await getSettings();
  const pay = o.payments[0];
  const stepIdx = STEPS.indexOf(o.status as (typeof STEPS)[number]);
  const b = s.payments.bank;

  return (
    <div className="container-bt max-w-3xl py-8">
      <p className="eyebrow">Order {o.number}</p>
      <h1 className="h1">{o.status === "PENDING" ? "Thank you, your order is in" : STATUS_LABEL[o.status]}</h1>
      {o.delivery && <p className="mt-2 text-ink-muted">Delivery to {o.recipient.name} on <b className="text-ink">{prettyDate(o.delivery.date)}</b>{o.delivery.slot && `, ${o.delivery.slot.label}`}.</p>}

      {stepIdx >= 0 && (
        <ol className="mt-6 grid grid-cols-5 gap-1 text-center text-xs">
          {STEPS.map((st, i) => (
            <li key={st} className="flex flex-col items-center gap-1">
              <span className={`grid h-8 w-8 place-items-center rounded-full ${i <= stepIdx ? "bg-brand text-on-brand" : "bg-surface-alt text-ink-muted"}`}>{i <= stepIdx ? <Check size={16} /> : i + 1}</span>
              <span className={i <= stepIdx ? "font-bold" : "text-ink-muted"}>{STATUS_LABEL[st]}</span>
            </li>
          ))}
        </ol>
      )}

      {pay?.method === "BANK_TRANSFER" && pay.status !== "PAID" && o.status !== "CANCELLED" && (
        <section className="card mt-8 space-y-3 p-5">
          <h2 className="h2">Pay by bank transfer</h2>
          <p className="text-sm">{b.instructions}</p>
          <BankDetails accounts={b.accounts} amount={pay.amount} reference={o.bulkRef ?? o.number} />
          {pay.status === "SLIP_UPLOADED" ? <p className="rounded-md bg-brand-soft p-3 text-sm font-medium">Slip received. We&apos;ll confirm your order shortly.</p> : <SlipUpload number={o.number} />}
        </section>
      )}
      {pay?.method === "COD" && o.status !== "DELIVERED" && <p className="mt-8 rounded-md bg-brand-soft p-4 text-sm">Cash on delivery: please have <b>{rs(pay.amount)}</b> ready for the rider.</p>}

      <section className="card mt-8 p-5">
        <h2 className="h2 mb-3">Order summary</h2>
        <ul className="divide-y divide-line text-sm">
          {o.lines.map((l) => <li key={l.id} className="flex justify-between gap-3 py-2"><span>{l.quantity} × {l.name}{l.meta?.items && <span className="hint block">{l.meta.items.map((i) => `${i.qty > 1 ? `${i.qty} × ` : ""}${i.name}`).join(", ")}</span>}</span><span>{rs(l.unitPrice * l.quantity)}</span></li>)}
          <li className="flex justify-between py-2"><span>Delivery</span><span>{rs(o.deliveryFee)}</span></li>
          {o.discount > 0 && <li className="flex justify-between py-2"><span>Discount {o.couponCode}</span><span>−{rs(o.discount)}</span></li>}
          <li className="flex justify-between py-2 font-bold"><span>Total</span><span>{rs(o.total)}</span></li>
          {o.voucherAmount > 0 && <><li className="flex justify-between py-2"><span>Gift voucher {o.voucherCode}</span><span>−{rs(o.voucherAmount)}</span></li><li className="flex justify-between py-2 font-bold"><span>To pay</span><span>{rs(o.total - o.voucherAmount)}</span></li></>}
        </ul>
        {o.giftMessage && <p className="mt-4 rounded-md bg-accent-soft p-3 text-sm"><b>Card:</b> {o.giftMessage}</p>}
      </section>

      {o.delivery?.photo && (
        <section className="card mt-8 p-5">
          <h2 className="h2 mb-3">Delivered</h2>
          <div className="relative aspect-[4/3] overflow-hidden rounded-md"><Image src={o.delivery.photo} alt="Delivery photo" fill className="object-cover" unoptimized /></div>
        </section>
      )}

      {s.notifications.push.publicKey && !["DELIVERED", "CANCELLED", "REFUNDED"].includes(o.status) && (
        <div className="card mt-8 p-5"><p className="mb-2 text-sm">Get a notification on this phone when your order moves.</p><PushEnable publicKey={s.notifications.push.publicKey} audience="CUSTOMER" orderNumber={o.number} /></div>
      )}
      {o.status === "DELIVERED" && o.reviewToken && <a href={`/review/${o.reviewToken}`} className="btn-primary mt-8">Leave a review</a>}

      {s.store.whatsapp && (
        <a href={waLink(s.store.whatsapp, `Hi Boxtop, about my order ${o.number}`)} target="_blank" rel="noopener" className="btn-outline mt-8">
          <MessageCircle size={18} strokeWidth={1.75} /> Questions? Message us on WhatsApp
        </a>
      )}
    </div>
  );
}
