"use client";
import { useActionState, useState } from "react";
import { requestQuote, acceptQuote, placeBulkOrder, uploadBulkSlip, type CState } from "@/app/actions/corporate";

export function QuoteRequestForm() {
  const [s, action, pending] = useActionState<CState, FormData>(requestQuote, {});
  if (s.ok) return <div className="card p-6"><h2 className="h2">Thank you, request received</h2><p className="mt-2 text-ink-muted">We&apos;ll prepare a quote and send you a link to review and accept it online, usually within a working day.</p></div>;
  return (
    <form action={action} className="card space-y-3 p-5">
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Your name</label><input name="contactName" className="input" required /></div>
        <div><label className="label">Company</label><input name="company" className="input" /></div>
        <div><label className="label">Mobile</label><input name="phone" className="input" inputMode="tel" required /></div>
        <div><label className="label">Email</label><input name="email" type="email" className="input" /></div>
        <div><label className="label">How many boxes?</label><input name="quantity" type="number" min={1} className="input" required /></div>
        <div><label className="label">Budget per box</label><select name="budget" className="input"><option value="">Choose</option><option>Under Rs. 5,000</option><option>Rs. 5,000–10,000</option><option>Rs. 10,000–20,000</option><option>Rs. 20,000+</option></select></div>
        <div><label className="label">Needed by</label><input name="neededBy" type="date" className="input" /></div>
        <div><label className="label">Branding</label><select name="branding" className="input"><option value="">None</option><option>Logo on the card</option><option>Logo sleeve on the box</option><option>Logo card and sleeve</option></select></div>
      </div>
      <div><label className="label">What do you have in mind?</label><textarea name="request" rows={4} className="input" placeholder="Occasion, what to include, one office or many addresses…" required /></div>
      <div><label className="label">Logo or reference (optional)</label><input name="photo" type="file" accept="image/*" className="input py-2" /></div>
      {s.error && <p role="alert" className="text-sm text-accent-text">{s.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Sending…" : "Request a quote"}</button>
    </form>
  );
}

export function AcceptQuoteForm({ token, slots, minDate }: { token: string; slots: { id: number; label: string }[]; minDate: string }) {
  const [s, action, pending] = useActionState<CState, FormData>(acceptQuote, {});
  return (
    <form action={action} className="card grid gap-3 p-5 sm:grid-cols-2">
      <input type="hidden" name="token" value={token} />
      <h2 className="h2 sm:col-span-2">Accept and place the order</h2>
      <div><label className="label">Deliver to (contact)</label><input name="recipientName" className="input" required /></div>
      <div><label className="label">Their mobile</label><input name="recipientPhone" className="input" inputMode="tel" required /></div>
      <div className="sm:col-span-2"><label className="label">Address</label><textarea name="address" rows={2} className="input" required /></div>
      <div><label className="label">City</label><input name="city" className="input" required /></div>
      <div><label className="label">Delivery date</label><input name="date" type="date" min={minDate} className="input" required /></div>
      <div><label className="label">Time slot</label><select name="slotId" className="input"><option value="">Any time</option>{slots.map((sl) => <option key={sl.id} value={sl.id}>{sl.label}</option>)}</select></div>
      <div><label className="label">Directions (optional)</label><input name="notes" className="input" /></div>
      <div className="sm:col-span-2"><label className="label">Card message (optional)</label><input name="giftMessage" className="input" /></div>
      {s.error && <p role="alert" className="text-sm text-accent-text sm:col-span-2">{s.error}</p>}
      <div className="sm:col-span-2"><button className="btn-primary" disabled={pending}>{pending ? "Placing order…" : "Accept quote"}</button><p className="hint mt-2">You&apos;ll pay by bank transfer on the next page.</p></div>
    </form>
  );
}

export function BulkOrderForm({ boxes, slots, minDate }: { boxes: { id: number; name: string; price: number; tiers: { minQty: number; unitPrice: number }[] }[]; slots: { id: number; label: string }[]; minDate: string }) {
  const [s, action, pending] = useActionState<CState, FormData>(placeBulkOrder, {});
  const [boxId, setBoxId] = useState(boxes[0]?.id ?? 0);
  const box = boxes.find((b) => b.id === boxId);
  return (
    <form action={action} className="space-y-5">
      <section className="card space-y-3 p-5">
        <h2 className="h2">1. The box</h2>
        <select name="boxId" className="input" value={boxId} onChange={(e) => setBoxId(Number(e.target.value))}>
          {boxes.map((b) => <option key={b.id} value={b.id}>{b.name} · Rs. {b.price.toLocaleString("en-LK")}</option>)}
        </select>
        {box && box.tiers.length > 0 && <p className="hint">Bulk prices: {box.tiers.map((t) => `${t.minQty}+ at Rs. ${t.unitPrice.toLocaleString("en-LK")}`).join(" · ")}</p>}
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="label">Boxes per address</label><input name="perAddress" type="number" min={1} defaultValue={1} className="input" /></div>
          <div><label className="label">Delivery date</label><input name="date" type="date" min={minDate} defaultValue={minDate} className="input" required /></div>
          <div><label className="label">Time slot</label><select name="slotId" className="input"><option value="">Any time</option>{slots.map((sl) => <option key={sl.id} value={sl.id}>{sl.label}</option>)}</select></div>
        </div>
        <div><label className="label">Card message for everyone <span className="font-normal text-ink-muted">(a message column in the list overrides it)</span></label><input name="giftMessage" className="input" /></div>
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="h2">2. The addresses</h2>
        <p className="text-sm">A CSV file (save from Excel or Google Sheets) with columns: <b>name, phone, address, city, message</b>. The message column is optional. <a href="/bulk-template.csv" className="font-bold text-brand" download>Download a template</a></p>
        <input name="csv" type="file" accept=".csv,text/csv" className="input py-2" />
        <details><summary className="cursor-pointer text-sm font-bold text-brand">Or paste the list</summary><textarea name="pasted" rows={6} className="input mt-2 font-mono text-sm" placeholder={"Nimal Perera,0771234567,12 Temple Rd,Kesbewa,Happy Avurudu!\nSara Silva,0719876543,45 Lake Rd,Colombo 5,"} /></details>
      </section>
      <section className="card grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="h2 sm:col-span-2">3. Your details</h2>
        <input name="senderName" className="input" placeholder="Your name" required aria-label="Your name" />
        <input name="senderPhone" className="input" placeholder="Mobile" inputMode="tel" required aria-label="Mobile" />
        <input name="senderEmail" type="email" className="input" placeholder="Email" aria-label="Email" />
        <input name="company" className="input" placeholder="Company (optional)" aria-label="Company" />
      </section>
      {s.error && (
        <div role="alert" className="rounded-md bg-accent-soft p-4 text-sm text-accent-text">
          <p className="font-bold">{s.error}</p>
          {s.errors && <ul className="mt-1 list-inside list-disc">{s.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        </div>
      )}
      <button className="btn-primary" disabled={pending}>{pending ? "Checking the list…" : "Place bulk order"}</button>
      <p className="hint">Delivery fees are worked out per address from our delivery zones. Pay by bank transfer on the next page.</p>
    </form>
  );
}

export function BulkSlipForm({ refCode }: { refCode: string }) {
  const [s, action, pending] = useActionState<CState, FormData>(uploadBulkSlip, {});
  if (s.ok) return <p className="rounded-md bg-brand-soft p-3 text-sm">Slip received. We&apos;ll confirm the order shortly.</p>;
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="ref" value={refCode} />
      <label className="label" htmlFor="bslip">Upload the payment slip</label>
      <input id="bslip" name="slip" type="file" accept="image/*" required className="input py-2" />
      {s.error && <p role="alert" className="text-sm text-accent-text">{s.error}</p>}
      <button className="btn-primary" disabled={pending}>Send slip</button>
    </form>
  );
}
