"use client";
import { useActionState, useState } from "react";
import { createManualOrder } from "@/app/actions/admin-orders";

type Box = { id: number; name: string; code: string | null; price: number };
type Zone = { id: number; name: string; fee: number };
type Slot = { id: number; label: string };

export function ManualOrderForm({ boxes, zones, slots, today }: { boxes: Box[]; zones: Zone[]; slots: Slot[]; today: string }) {
  const [s, action, pending] = useActionState(createManualOrder, {});
  const [rows, setRows] = useState([{ key: 1, boxId: "", qty: 1 }]);
  const [zoneId, setZoneId] = useState("");
  const zone = zones.find((z) => String(z.id) === zoneId);
  const subtotal = rows.reduce((t, r) => t + (boxes.find((b) => String(b.id) === r.boxId)?.price ?? 0) * r.qty, 0);

  return (
    <form action={action} className="space-y-5">
      <section className="card space-y-3 p-5">
        <h2 className="h2">Where did it come from?</h2>
        <select name="source" className="input" defaultValue="WHATSAPP">
          <option value="WHATSAPP">WhatsApp</option><option value="MESSENGER">Facebook Messenger</option><option value="INSTAGRAM">Instagram</option><option value="PHONE">Phone call</option>
        </select>
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="h2">Boxes</h2>
        {rows.map((r, i) => (
          <div key={r.key} className="flex gap-2">
            <select name="boxId" className="input" value={r.boxId} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, boxId: e.target.value } : x)))}>
              <option value="">Choose a box</option>
              {boxes.map((b) => <option key={b.id} value={b.id}>{b.code ? `${b.code} · ` : ""}{b.name} · Rs. {b.price.toLocaleString("en-LK")}</option>)}
            </select>
            <input name="boxQty" type="number" min={1} value={r.qty} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))} className="input w-20" aria-label="Quantity" />
          </div>
        ))}
        <button type="button" className="text-sm font-bold text-brand" onClick={() => setRows([...rows, { key: Date.now(), boxId: "", qty: 1 }])}>+ Another box</button>
        <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
          <input name="customName" className="input" placeholder="Custom item (e.g. Custom birthday box)" />
          <input name="customPrice" type="number" min={0} className="input" placeholder="Price" />
        </div>
      </section>
      <section className="card grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="h2 sm:col-span-2">Customer and recipient</h2>
        <input name="customerName" className="input" placeholder="Customer name" required />
        <input name="customerPhone" className="input" placeholder="Customer mobile" required inputMode="tel" />
        <input name="customerEmail" type="email" className="input sm:col-span-2" placeholder="Customer email (optional, for updates)" />
        <input name="recipientName" className="input" placeholder="Recipient name" required />
        <input name="recipientPhone" className="input" placeholder="Recipient mobile" required inputMode="tel" />
        <textarea name="address" className="input sm:col-span-2" rows={2} placeholder="Address" required />
        <input name="city" className="input" placeholder="City" required />
        <input name="notes" className="input" placeholder="Directions (optional)" />
      </section>
      <section className="card grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="h2 sm:col-span-2">Delivery and payment</h2>
        <div><label className="label">Zone</label><select name="zoneId" className="input" value={zoneId} onChange={(e) => setZoneId(e.target.value)}><option value="">–</option>{zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select></div>
        <div><label className="label">Delivery fee</label><input name="fee" type="number" min={0} className="input" placeholder={zone ? String(zone.fee) : "0"} /></div>
        <div><label className="label">Date</label><input name="date" type="date" defaultValue={today} className="input" required /></div>
        <div><label className="label">Slot</label><select name="slotId" className="input">{slots.map((sl) => <option key={sl.id} value={sl.id}>{sl.label}</option>)}</select></div>
        <div><label className="label">Payment</label><select name="payment" className="input"><option value="BANK_TRANSFER">Bank transfer</option><option value="COD">Cash on delivery</option></select></div>
        <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="paid" className="h-4 w-4" /> Already paid (confirms the order)</label>
        <textarea name="giftMessage" className="input sm:col-span-2" rows={2} placeholder="Card message" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="surprise" className="h-4 w-4" /> Keep it a surprise</label>
        <input name="internalNote" className="input sm:col-span-2" placeholder="Internal note" />
      </section>
      <div className="flex items-center gap-4">
        <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Create order"}</button>
        <span className="hint">Boxes Rs. {subtotal.toLocaleString("en-LK")} + delivery</span>
      </div>
      {s.error && <p role="alert" className="text-sm text-accent-text">{s.error}</p>}
    </form>
  );
}
