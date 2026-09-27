"use client";
import { useActionState, useState } from "react";
import { buyVoucher, uploadVoucherSlip } from "@/app/actions/voucher";

const AMOUNTS = [2500, 5000, 10000, 20000];

export function BuyVoucherForm() {
  const [s, action, pending] = useActionState(buyVoucher, {});
  const [amt, setAmt] = useState("5000");
  return (
    <form action={action} className="card space-y-4 p-5">
      <fieldset>
        <legend className="label">Amount</legend>
        <div className="flex flex-wrap gap-2">
          {[...AMOUNTS.map(String), "custom"].map((a) => (
            <label key={a} className={`chip cursor-pointer ${amt === a ? "chip-on" : ""}`}>
              <input type="radio" name="amount" value={a} checked={amt === a} onChange={() => setAmt(a)} className="sr-only" />
              {a === "custom" ? "Other amount" : `Rs. ${Number(a).toLocaleString("en-LK")}`}
            </label>
          ))}
        </div>
        {amt === "custom" && <input name="customAmount" type="number" min={1000} step={100} className="input mt-2 w-48" placeholder="Rs." aria-label="Amount in rupees" required />}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Your name</label><input name="buyerName" className="input" required /></div>
        <div><label className="label">Your mobile</label><input name="buyerPhone" className="input" inputMode="tel" required /></div>
        <div className="sm:col-span-2"><label className="label">Your email</label><input name="buyerEmail" type="email" className="input" /></div>
      </div>
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="label">Send it to <span className="font-normal text-ink-muted">(optional: leave empty to receive it yourself)</span></legend>
        <input name="toName" className="input" placeholder="Their name" aria-label="Recipient name" />
        <input name="toEmail" type="email" className="input" placeholder="Their email" aria-label="Recipient email" />
        <textarea name="message" maxLength={300} rows={2} className="input sm:col-span-2" placeholder="A message to go with it" aria-label="Message" />
      </fieldset>
      {s.error && <p role="alert" className="text-sm text-accent-text">{s.error}</p>}
      <button className="btn-primary" disabled={pending}>Continue to payment</button>
      <p className="hint">Pay by bank transfer on the next page. We email the code once payment is confirmed. Valid for 12 months.</p>
    </form>
  );
}

export function VoucherSlipForm({ token }: { token: string }) {
  const [s, action, pending] = useActionState(uploadVoucherSlip, {});
  if (s.ok) return <p className="rounded-md bg-brand-soft p-3 text-sm">Slip received. We&apos;ll email the voucher code once payment is confirmed.</p>;
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="token" value={token} />
      <label className="label" htmlFor="vslip">Upload the payment slip</label>
      <input id="vslip" name="slip" type="file" accept="image/*" required className="input py-2" />
      {s.error && <p role="alert" className="text-sm text-accent-text">{s.error}</p>}
      <button className="btn-primary" disabled={pending}>Send slip</button>
    </form>
  );
}
