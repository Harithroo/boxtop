"use client";
import { useMemo, useState } from "react";
import { addBuild } from "@/app/actions/cart";

type Size = { id: number; name: string; description: string | null; capacity: number; basePrice: number; image: string | null; allowed: number[] | null };
type Item = { id: number; name: string; size: string | null; price: number; image: string | null; category: string | null; stock: number | null; maker: string | null };

const rs = (n: number) => `Rs. ${n.toLocaleString("en-LK")}`;

export function Builder({ sizes, items }: { sizes: Size[]; items: Item[] }) {
  const [sizeId, setSizeId] = useState<number | null>(sizes.length === 1 ? sizes[0].id : null);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [note, setNote] = useState("");
  const [cat, setCat] = useState<string>("All");
  const size = sizes.find((s) => s.id === sizeId);
  const pool = items.filter((i) => !size?.allowed || size.allowed.includes(i.id));
  const cats = ["All", ...new Set(pool.map((i) => i.category).filter(Boolean) as string[])];
  const count = Object.values(picked).reduce((a, b) => a + b, 0);
  const itemsTotal = pool.reduce((s, i) => s + (picked[i.id] ?? 0) * i.price, 0);
  const total = (size?.basePrice ?? 0) + itemsTotal;
  const full = size ? count >= size.capacity : true;
  const payload = useMemo(() => JSON.stringify(Object.entries(picked).filter(([, q]) => q > 0).map(([id, q]) => [Number(id), q])), [picked]);

  const change = (i: Item, d: number) => setPicked((p) => {
    const next = Math.max(0, (p[i.id] ?? 0) + d);
    if (i.stock !== null && next > i.stock) return p;
    return { ...p, [i.id]: next };
  });

  const chooseSize = (id: number) => {
    const s = sizes.find((x) => x.id === id)!;
    setSizeId(id);
    // drop items not allowed in this size and trim to capacity
    setPicked((p) => {
      const out: Record<number, number> = {}; let n = 0;
      for (const [k, q] of Object.entries(p)) {
        const kid = Number(k);
        if (s.allowed && !s.allowed.includes(kid)) continue;
        const take = Math.min(q, s.capacity - n); if (take > 0) { out[kid] = take; n += take; }
      }
      return out;
    });
  };

  return (
    <form action={addBuild} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="sizeId" value={sizeId ?? ""} />
      <input type="hidden" name="items" value={payload} />
      <div className="min-w-0 space-y-6">
        <section>
          <p className="eyebrow">Step 1</p>
          <h2 className="h2 mb-3">Choose a box size</h2>
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Box size">
            {sizes.map((s) => (
              <button type="button" key={s.id} role="radio" aria-checked={sizeId === s.id} onClick={() => chooseSize(s.id)}
                className={`card p-4 text-left ${sizeId === s.id ? "ring-2 ring-brand" : ""}`}>
                <span className="block font-bold">{s.name}</span>
                <span className="hint block">Up to {s.capacity} items{s.description && ` · ${s.description}`}</span>
                <span className="price mt-2 block">from {rs(s.basePrice)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className={size ? "" : "pointer-events-none opacity-40"}>
          <p className="eyebrow">Step 2</p>
          <h2 className="h2 mb-3">Fill it</h2>
          {cats.length > 2 && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {cats.map((c) => <button type="button" key={c} onClick={() => setCat(c)} className={`chip shrink-0 ${cat === c ? "chip-on" : ""}`}>{c}</button>)}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 min-[720px]:grid-cols-3">
            {pool.filter((i) => cat === "All" || i.category === cat).map((i) => {
              const q = picked[i.id] ?? 0;
              const out = i.stock !== null && i.stock <= 0;
              return (
                <div key={i.id} className={`card flex flex-col overflow-hidden ${q ? "ring-2 ring-brand" : ""}`}>
                  <div className="aspect-square bg-surface-alt">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {i.image ? <img src={i.image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-3xl text-brand/40">✦</div>}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="text-sm font-bold leading-5">{i.name}</p>
                    <p className="hint">{[i.size, i.maker].filter(Boolean).join(" · ")}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="whitespace-nowrap text-sm font-bold">{rs(i.price)}</span>
                      {out ? <span className="hint">Sold out</span> : (
                        <div className="flex items-center rounded-md border border-line">
                          <button type="button" className="h-9 w-9 disabled:opacity-30" disabled={!q} onClick={() => change(i, -1)} aria-label={`Remove ${i.name}`}>−</button>
                          <span className="w-5 text-center text-sm font-bold">{q}</span>
                          <button type="button" className="h-9 w-9 disabled:opacity-30" disabled={full || (i.stock !== null && q >= i.stock)} onClick={() => change(i, 1)} aria-label={`Add ${i.name}`}>+</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={count ? "" : "pointer-events-none opacity-40"}>
          <p className="eyebrow">Step 3</p>
          <h2 className="h2 mb-3">Anything we should know?</h2>
          <textarea name="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} rows={2} className="input" placeholder="Colours, a theme, or who it's for. You'll write the card message at checkout." />
        </section>
      </div>

      <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-24">
        <h2 className="h2">Your box</h2>
        {size ? (
          <>
            <p className="text-sm">{size.name} · {count} of {size.capacity} items</p>
            <div className="h-2 overflow-hidden rounded-full bg-surface-alt" role="progressbar" aria-valuenow={count} aria-valuemin={0} aria-valuemax={size.capacity} aria-label="Box fill">
              <div className="h-full bg-accent transition-all" style={{ width: `${Math.min(100, (count / size.capacity) * 100)}%` }} />
            </div>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between"><span>Box, wrapping and card</span><span>{rs(size.basePrice)}</span></li>
              {pool.filter((i) => picked[i.id]).map((i) => <li key={i.id} className="flex justify-between"><span>{picked[i.id]} × {i.name}</span><span>{rs(i.price * picked[i.id])}</span></li>)}
            </ul>
            <div className="flex justify-between border-t border-line pt-3"><span className="font-bold">Total</span><span className="price">{rs(total)}</span></div>
          </>
        ) : <p className="hint">Choose a size to start.</p>}
        <button className="btn-primary w-full" disabled={!size || !count}>Add to cart</button>
      </aside>
    </form>
  );
}
