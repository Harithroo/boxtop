"use client";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { DeliveryPicker } from "./DeliveryPicker";
import { addToCart } from "@/app/actions/cart";

type Zone = { id: number; name: string; cities: string; fee: number };
type AddOn = { id: number; name: string; price: number };

export function BuyPanel({ box, zones, addOns, whatsapp }: {
  box: { id: number; name: string; code: string | null; price: number; leadDays: number; sameDay: boolean; soldOut: boolean };
  zones: Zone[]; addOns: AddOn[]; whatsapp: string;
}) {
  const [qty, setQty] = useState(1);
  const [picked, setPicked] = useState<number[]>([]);
  const [d, setD] = useState<{ date?: string; slot?: string; city?: string }>({});
  const extras = addOns.filter((a) => picked.includes(a.id));
  const total = box.price * qty + extras.reduce((s, a) => s + a.price, 0);

  const waText = [
    `Hi Boxtop, I'd like to order:`,
    `${qty} × ${box.name}${box.code ? ` (${box.code})` : ""}, Rs. ${(box.price * qty).toLocaleString("en-LK")}`,
    ...extras.map((a) => `+ ${a.name}, Rs. ${a.price.toLocaleString("en-LK")}`),
    d.city ? `Delivery to ${d.city}${d.date ? ` on ${d.date}` : ""}${d.slot ? `, ${d.slot}` : ""}` : "",
  ].filter(Boolean).join("\n");
  const wa = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "").replace(/^0/, "94")}?text=${encodeURIComponent(waText)}` : "";

  return (
    <form action={addToCart} className="space-y-5">
      <input type="hidden" name="boxId" value={box.id} />
      <DeliveryPicker zones={zones} lead={box.leadDays} sameDay={box.sameDay} onChange={setD} />

      {addOns.length > 0 && (
        <fieldset>
          <legend className="label">Add something extra</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {addOns.map((a) => (
              <label key={a.id} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm ${picked.includes(a.id) ? "border-2 border-brand bg-brand-soft" : "border-line bg-surface"}`}>
                <input type="checkbox" name="addon" value={a.id} className="h-4 w-4 accent-[#3C2894]"
                  onChange={(e) => setPicked((p) => (e.target.checked ? [...p, a.id] : p.filter((x) => x !== a.id)))} />
                <span className="flex-1">{a.name}</span><span className="font-bold">Rs. {a.price.toLocaleString("en-LK")}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex items-center gap-3">
        <label htmlFor="qty" className="label mb-0">Quantity</label>
        <div className="flex items-center rounded-md border border-line bg-surface">
          <button type="button" className="h-11 w-11 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Fewer">−</button>
          <input id="qty" name="qty" value={qty} readOnly className="w-10 bg-transparent text-center font-bold" />
          <button type="button" className="h-11 w-11 text-lg" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="More">+</button>
        </div>
        <span className="price ml-auto">Rs. {total.toLocaleString("en-LK")}</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button className="btn-primary" disabled={box.soldOut}>{box.soldOut ? "Sold out" : "Add to cart"}</button>
        {wa && (
          <a href={wa} target="_blank" rel="noopener" className="btn border border-[#1E7A4C] bg-surface text-[#1E7A4C] hover:bg-[#1E7A4C] hover:text-white">
            <MessageCircle size={18} strokeWidth={1.75} /> Order on WhatsApp
          </a>
        )}
      </div>
    </form>
  );
}
