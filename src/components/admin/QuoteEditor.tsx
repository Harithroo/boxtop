"use client";
import { useActionState, useState } from "react";
import { saveQuote, type QState } from "@/app/actions/admin-extra";

type Box = { id: number; name: string; price: number; tiers: { minQty: number; unitPrice: number }[] };
type Line = { key: number; boxId: number; name: string; qty: number; price: number };

export function QuoteEditor({ quoteId, boxes, initial, deliveryFee, discount, notes, expiresAt, locked }: {
  quoteId: number; boxes: Box[]; initial: Omit<Line, "key">[]; deliveryFee: number; discount: number; notes: string; expiresAt: string; locked: boolean;
}) {
  const [s, action, pending] = useActionState<QState, FormData>(saveQuote, {});
  const [lines, setLines] = useState<Line[]>(initial.length ? initial.map((l, i) => ({ ...l, key: i })) : [{ key: 0, boxId: 0, name: "", qty: 1, price: 0 }]);
  const [fee, setFee] = useState(deliveryFee);
  const [disc, setDisc] = useState(discount);
  const priceFor = (b: Box, q: number) => Math.min(b.price, ...b.tiers.filter((t) => q >= t.minQty).map((t) => t.unitPrice));
  const set = (i: number, patch: Partial<Line>) => setLines(lines.map((l, j) => {
    if (j !== i) return l;
    const next = { ...l, ...patch };
    const b = boxes.find((x) => x.id === next.boxId);
    if (b && (patch.boxId !== undefined || patch.qty !== undefined) && patch.price === undefined) next.price = priceFor(b, next.qty);
    if (b && patch.boxId !== undefined) next.name = "";
    return next;
  }));
  const subtotal = lines.reduce((t, l) => t + l.qty * l.price, 0);
  return (
    <form action={action} className="card space-y-4 p-5">
      <input type="hidden" name="id" value={quoteId} />
      <h2 className="h2">Quote lines</h2>
      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={l.key} className="grid gap-2 sm:grid-cols-[1.2fr_1fr_90px_120px_auto]">
            <select name="lineBox" value={l.boxId} onChange={(e) => set(i, { boxId: Number(e.target.value) })} className="input" aria-label="Box" disabled={locked}>
              <option value={0}>Custom item</option>
              {boxes.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <input name="lineName" value={l.name} onChange={(e) => set(i, { name: e.target.value })} className="input" placeholder={l.boxId ? "Same as box name" : "Item name"} aria-label="Line name" disabled={locked} />
            <input name="lineQty" type="number" min={1} value={l.qty} onChange={(e) => set(i, { qty: Number(e.target.value) })} className="input" aria-label="Quantity" disabled={locked} />
            <input name="linePrice" type="number" min={0} value={l.price} onChange={(e) => set(i, { price: Number(e.target.value) })} className="input" aria-label="Unit price" disabled={locked} />
            {!locked && <button type="button" className="text-xs text-accent-text" onClick={() => setLines(lines.filter((_, j) => j !== i))}>Remove</button>}
          </div>
        ))}
      </div>
      {!locked && <button type="button" className="text-sm font-bold text-brand" onClick={() => setLines([...lines, { key: Date.now(), boxId: 0, name: "", qty: 1, price: 0 }])}>+ Add line</button>}
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label className="label">Delivery fee (total)</label><input name="deliveryFee" type="number" min={0} value={fee} onChange={(e) => setFee(Number(e.target.value))} className="input" disabled={locked} /></div>
        <div><label className="label">Discount</label><input name="discount" type="number" min={0} value={disc} onChange={(e) => setDisc(Number(e.target.value))} className="input" disabled={locked} /></div>
        <div><label className="label">Valid until</label><input name="expiresAt" type="date" defaultValue={expiresAt} className="input" disabled={locked} /></div>
      </div>
      <div><label className="label">Notes for the customer</label><textarea name="notes" defaultValue={notes} rows={3} className="input" placeholder="What's included, branding, delivery arrangements, payment terms…" disabled={locked} /></div>
      <p className="text-sm">Lines Rs. {subtotal.toLocaleString("en-LK")} − discount Rs. {disc.toLocaleString("en-LK")} + delivery Rs. {fee.toLocaleString("en-LK")} = <b className="price">Rs. {(subtotal - disc + fee).toLocaleString("en-LK")}</b></p>
      {!locked && (
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-outline" disabled={pending}>Save draft</button>
          <button name="send" value="1" className="btn-primary" disabled={pending}>Save and send to customer</button>
          {s.error && <span role="alert" className="text-sm text-accent-text">{s.error}</span>}
          {s.ok && !s.error && <span className="text-sm text-success">Saved</span>}
        </div>
      )}
    </form>
  );
}
