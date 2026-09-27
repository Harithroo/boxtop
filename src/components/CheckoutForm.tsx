"use client";
import { useActionState, useState } from "react";
import { placeOrder, type CheckoutState } from "@/app/actions/checkout";
import { DeliveryPicker } from "./DeliveryPicker";

type Zone = { id: number; name: string; cities: string; fee: number; codAllowed: boolean };

export function CheckoutForm({ zones, subtotal, lead, sameDay, initial, cod, bank, channels }: {
  zones: Zone[]; subtotal: number; lead: number; sameDay: boolean;
  initial: { zoneId?: number; date?: string; slotId?: number };
  cod: { enabled: boolean; maxOrder: number }; bank: { enabled: boolean }; channels: string[];
}) {
  const optIns = ([["email", "Email"], ["sms", "SMS"], ["whatsapp", "WhatsApp"]] as const).filter(([k]) => channels.includes(k));
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const v = state.fields ?? {};
  const [zone, setZone] = useState<Zone | undefined>();
  const fee = zone?.fee ?? 0;
  const total = subtotal + fee;
  const codOk = cod.enabled && (zone ? zone.codAllowed : true) && (!cod.maxOrder || total <= cod.maxOrder);
  const [pay, setPay] = useState<string>(v.payment ?? "");
  const [msg, setMsg] = useState(v.giftMessage ?? "");

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-6">
        <section className="card space-y-3 p-5">
          <h2 className="h2">Your details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="senderName">Your name</label><input id="senderName" name="senderName" className="input" defaultValue={v.senderName} required autoComplete="name" /></div>
            <div><label className="label" htmlFor="senderPhone">Mobile number</label><input id="senderPhone" name="senderPhone" className="input" defaultValue={v.senderPhone} required inputMode="tel" autoComplete="tel" placeholder="077 123 4567" /></div>
          </div>
          <div><label className="label" htmlFor="senderEmail">Email <span className="font-normal text-ink-muted">(for order updates)</span></label><input id="senderEmail" name="senderEmail" type="email" className="input" defaultValue={v.senderEmail} autoComplete="email" /></div>
          <fieldset>
            <legend className="label">Send me order updates by</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              {optIns.map(([k, l]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" name={`notify_${k}`} defaultChecked={k !== "whatsapp"} className="h-4 w-4 accent-[#3C2894]" /> {l}</label>)}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="marketing" className="h-4 w-4 accent-[#3C2894]" /> Send me offers and reminders (you can stop any time)</label>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="h2">Who is it for?</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="recipientName">Recipient&apos;s name</label><input id="recipientName" name="recipientName" className="input" defaultValue={v.recipientName} required /></div>
            <div><label className="label" htmlFor="recipientPhone">Recipient&apos;s mobile</label><input id="recipientPhone" name="recipientPhone" className="input" defaultValue={v.recipientPhone} required inputMode="tel" /></div>
          </div>
          <div><label className="label" htmlFor="address">Delivery address</label><textarea id="address" name="address" rows={2} className="input" defaultValue={v.address} required autoComplete="street-address" /></div>
          <DeliveryPicker zones={zones} lead={lead} sameDay={sameDay} initial={initial} required
            onChange={(d) => setZone(d.zone ? zones.find((z) => z.id === d.zone!.id) : undefined)} />
          <div><label className="label" htmlFor="notes">Directions for the rider <span className="font-normal text-ink-muted">(optional)</span></label><input id="notes" name="notes" className="input" defaultValue={v.notes} placeholder="Landmark, gate colour, best time to call" /></div>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="surprise" className="mt-1 h-4 w-4 accent-[#3C2894]" /> <span><b>Keep it a surprise.</b> We won&apos;t mention the gift if we need to call them.</span></label>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="callToArrange" className="mt-1 h-4 w-4 accent-[#3C2894]" /> <span><b>Call the recipient to arrange delivery.</b> Useful if you don&apos;t know their exact address.</span></label>
        </section>

        <section className="card space-y-2 p-5">
          <h2 className="h2">Card message</h2>
          <textarea name="giftMessage" rows={3} maxLength={300} value={msg} onChange={(e) => setMsg(e.target.value)} className="input" placeholder="Happy birthday Amma! Love, Nimal" aria-label="Card message" />
          <p className="hint text-right">{msg.length}/300 · printed on a card inside the box</p>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="h2">Payment</h2>
          {cod.enabled && (
            <label className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${pay === "COD" ? "border-2 border-brand bg-brand-soft" : "border-line"} ${!codOk ? "opacity-50" : ""}`}>
              <input type="radio" name="payment" value="COD" disabled={!codOk} checked={pay === "COD"} onChange={() => setPay("COD")} className="mt-1 accent-[#3C2894]" />
              <span><b>Cash on delivery</b><span className="hint block">{codOk ? "Pay the rider when the box arrives." : cod.maxOrder && total > cod.maxOrder ? `For orders up to Rs. ${cod.maxOrder.toLocaleString("en-LK")}.` : "Not available for this area."}</span></span>
            </label>
          )}
          {bank.enabled && (
            <label className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${pay === "BANK_TRANSFER" ? "border-2 border-brand bg-brand-soft" : "border-line"}`}>
              <input type="radio" name="payment" value="BANK_TRANSFER" checked={pay === "BANK_TRANSFER"} onChange={() => setPay("BANK_TRANSFER")} className="mt-1 accent-[#3C2894]" />
              <span><b>Bank transfer</b><span className="hint block">We&apos;ll show our bank details next. Upload the slip and we confirm your order.</span></span>
            </label>
          )}
        </section>
      </div>

      <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-24">
        <div className="flex justify-between"><span>Subtotal</span><span>Rs. {subtotal.toLocaleString("en-LK")}</span></div>
        <div className="flex justify-between"><span>Delivery</span><span>{zone ? `Rs. ${fee.toLocaleString("en-LK")}` : "Choose city"}</span></div>
        <div><label className="label" htmlFor="coupon">Discount code</label><input id="coupon" name="coupon" className="input uppercase" defaultValue={v.coupon} /></div>
        <div><label className="label" htmlFor="voucher">Gift voucher code</label><input id="voucher" name="voucher" className="input uppercase" defaultValue={v.voucher} /></div>
        <div className="flex justify-between border-t border-line pt-3"><span className="font-bold">Total</span><span className="price">Rs. {total.toLocaleString("en-LK")}</span></div>
        <p className="hint">Discounts and vouchers are applied when you place the order.</p>
        {state.error && <p role="alert" className="rounded-md bg-accent-soft p-3 text-sm font-medium text-accent-text">{state.error}</p>}
        <button className="btn-primary w-full" disabled={pending}>{pending ? "Placing order…" : "Place order"}</button>
      </aside>
    </form>
  );
}
