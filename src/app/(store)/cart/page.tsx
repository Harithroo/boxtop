import Link from "next/link";
import Image from "next/image";
import { loadCart } from "@/lib/cart";
import { getAddOns } from "@/lib/catalog";
import { rs } from "@/lib/format";
import { GiftArt } from "@/components/GiftArt";
import { updateLine, addAddOn, updateBuild } from "@/app/actions/cart";

export const metadata = { title: "Your cart" };
export const dynamic = "force-dynamic";

function Qty({ kind, id, q }: { kind: "box" | "addon"; id: number; q: number }) {
  return (
    <div className="flex items-center rounded-md border border-line">
      <form action={updateLine}><input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} /><input type="hidden" name="qty" value={q - 1} /><button className="h-9 w-9" aria-label="Fewer">−</button></form>
      <span className="w-6 text-center text-sm font-bold">{q}</span>
      <form action={updateLine}><input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} /><input type="hidden" name="qty" value={q + 1} /><button className="h-9 w-9" aria-label="More">+</button></form>
    </div>
  );
}

export default async function CartPage() {
  const cart = await loadCart();
  const allAddOns = await getAddOns();
  const suggest = allAddOns.filter((a) => !cart.addons.find((x) => x.addOn.id === a.id)).slice(0, 4);

  if (cart.empty)
    return (
      <div className="container-bt py-16 text-center">
        <h1 className="h1">Your cart is empty</h1>
        <p className="mt-2 text-ink-muted">Find a box for their day.</p>
        <Link href="/shop" className="btn-primary mt-6">Shop gift boxes</Link>
      </div>
    );

  return (
    <div className="container-bt py-8">
      <h1 className="h1 mb-6">Your cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-3">
          {cart.lines.map(({ box, q, unit }) => (
            <div key={box.id} className="card flex gap-3 p-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-surface-alt">
                {box.images[0] ? <Image src={box.images[0].url} alt="" fill className="object-cover" unoptimized /> : <GiftArt seed={box.id} className="h-full w-full" />}
              </div>
              <div className="flex flex-1 flex-col">
                <Link href={`/box/${box.slug}`} className="font-bold">{box.name}</Link>
                <span className="hint">{rs(unit)} each{unit < box.price && <> · bulk price (was {rs(box.price)})</>}</span>
                <div className="mt-auto flex items-center justify-between pt-2"><Qty kind="box" id={box.id} q={q} /><span className="price">{rs(unit * q)}</span></div>
              </div>
            </div>
          ))}
          {cart.builds.map((b) => (
            <div key={b.key} className="card flex gap-3 p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-surface-alt"><GiftArt seed={b.size.id + 2} className="h-full w-full" /></div>
              <div className="flex flex-1 flex-col">
                <span className="font-bold">Your own box · {b.size.name}</span>
                <span className="hint">{b.contents.map((c) => `${c.qty > 1 ? `${c.qty} × ` : ""}${c.name}`).join(", ")}</span>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-md border border-line">
                    <form action={updateBuild}><input type="hidden" name="key" value={b.key} /><input type="hidden" name="qty" value={b.q - 1} /><button className="h-9 w-9" aria-label="Fewer">−</button></form>
                    <span className="w-6 text-center text-sm font-bold">{b.q}</span>
                    <form action={updateBuild}><input type="hidden" name="key" value={b.key} /><input type="hidden" name="qty" value={b.q + 1} /><button className="h-9 w-9" aria-label="More">+</button></form>
                  </div>
                  <span className="price">{rs(b.unit * b.q)}</span>
                </div>
              </div>
            </div>
          ))}
          {cart.addons.map(({ addOn, q }) => (
            <div key={addOn.id} className="card flex items-center gap-3 p-3">
              <span className="flex-1 text-sm"><b>{addOn.name}</b><br /><span className="hint">Extra</span></span>
              <Qty kind="addon" id={addOn.id} q={q} /><span className="price w-24 text-right">{rs(addOn.price * q)}</span>
            </div>
          ))}
          {suggest.length > 0 && (
            <div className="pt-4">
              <p className="label">Add a little extra</p>
              <div className="flex flex-wrap gap-2">
                {suggest.map((a) => (
                  <form key={a.id} action={addAddOn}><input type="hidden" name="id" value={a.id} /><button className="chip">+ {a.name} · {rs(a.price)}</button></form>
                ))}
              </div>
            </div>
          )}
        </div>
        <aside className="card h-fit p-5">
          <div className="flex justify-between"><span>Subtotal</span><span className="price">{rs(cart.subtotal)}</span></div>
          <p className="hint mt-1">Delivery fee and date are set at checkout.</p>
          <Link href="/checkout" className="btn-primary mt-5 w-full">Checkout</Link>
          <Link href="/shop" className="mt-3 block text-center text-sm font-bold text-brand">Keep shopping</Link>
        </aside>
      </div>
    </div>
  );
}
