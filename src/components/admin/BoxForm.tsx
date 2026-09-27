"use client";
import { useActionState } from "react";
import { saveBox } from "@/app/actions/admin-boxes";

type Box = {
  id: number; name: string; slug: string; code: string | null; summary: string | null; description: string | null; price: number; compareAtPrice: number | null;
  status: string; badge: string | null; tags?: string | null; featured: boolean; sameDay: boolean; leadDays: number; stock: number | null; sortOrder: number; seoTitle: string | null; seoDescription: string | null;
};
type Col = { id: number; name: string; kind: string };

export function BoxForm({ box, collections, selected, images, contents, tiers = "" }: {
  box?: Box; collections: Col[]; selected: number[]; images: { id: number; url: string }[]; contents: string; tiers?: string;
}) {
  const [s, action, pending] = useActionState(saveBox, {});
  const groups = ["OCCASION", "RECIPIENT", "CURATED"];
  return (
    <form action={action} className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="id" value={box?.id ?? ""} />
      <div className="space-y-5">
        <section className="card space-y-3 p-5">
          <div><label className="label" htmlFor="name">Name</label><input id="name" name="name" defaultValue={box?.name} className="input" required /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="code">Package code</label><input id="code" name="code" defaultValue={box?.code ?? ""} className="input uppercase" placeholder="P15" /><p className="hint mt-1">Customers can search &ldquo;15&rdquo; or &ldquo;Package 15&rdquo;.</p></div>
            <div><label className="label" htmlFor="slug">Web address</label><input id="slug" name="slug" defaultValue={box?.slug} className="input" placeholder="made from the name" /></div>
          </div>
          <div><label className="label" htmlFor="summary">Contents line (shown on cards)</label><input id="summary" name="summary" defaultValue={box?.summary ?? ""} className="input" maxLength={255} placeholder="A ladies' watch, Ferrero Rocher, KitKat and a teddy" /></div>
          <div><label className="label" htmlFor="contents">What&apos;s inside, one per line</label><textarea id="contents" name="contents" defaultValue={contents} rows={5} className="input font-mono text-sm" placeholder={"Ladies' watch\n2 x KitKat (4 finger)\nTeddy bear (20cm)"} /></div>
          <div><label className="label" htmlFor="description">Description</label><textarea id="description" name="description" defaultValue={box?.description ?? ""} rows={5} className="input" /></div>
        </section>
        <section className="card space-y-3 p-5">
          <h2 className="h2">Photos</h2>
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {images.map((i) => (
                <label key={i.id} className="relative block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.url} alt="" className="aspect-square w-full rounded-md object-cover" />
                  <span className="mt-1 flex items-center gap-1 text-xs"><input type="checkbox" name="deleteImage" value={i.id} /> Remove</span>
                </label>
              ))}
            </div>
          )}
          <input type="file" name="images" accept="image/*" multiple className="input py-2" />
          <p className="hint">Square photos work best. No prices on the photo. They&apos;re resized automatically.</p>
        </section>
        <section className="card space-y-3 p-5">
          <h2 className="h2">Search listing</h2>
          <input name="seoTitle" defaultValue={box?.seoTitle ?? ""} className="input" placeholder="Title for Google (optional)" />
          <textarea name="seoDescription" defaultValue={box?.seoDescription ?? ""} rows={2} maxLength={300} className="input" placeholder="Description for Google (optional)" />
        </section>
      </div>
      <aside className="space-y-5">
        <section className="card space-y-3 p-5">
          <div><label className="label" htmlFor="status">Status</label><select id="status" name="status" defaultValue={box?.status ?? "ACTIVE"} className="input"><option value="ACTIVE">Live</option><option value="DRAFT">Draft (hidden)</option><option value="ARCHIVED">Archived</option></select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="price">Price (Rs.)</label><input id="price" name="price" type="number" min={0} defaultValue={box?.price} className="input" required /></div>
            <div><label className="label" htmlFor="compareAtPrice">Was (Rs.)</label><input id="compareAtPrice" name="compareAtPrice" type="number" min={0} defaultValue={box?.compareAtPrice ?? ""} className="input" /></div>
            <div><label className="label" htmlFor="stock">Stock</label><input id="stock" name="stock" type="number" min={0} defaultValue={box?.stock ?? ""} className="input" placeholder="not tracked" /></div>
            <div><label className="label" htmlFor="leadDays">Lead days</label><input id="leadDays" name="leadDays" type="number" min={0} defaultValue={box?.leadDays ?? 0} className="input" /></div>
          </div>
          <div><label className="label" htmlFor="tiers">Bulk prices</label><textarea id="tiers" name="tiers" defaultValue={tiers} rows={3} className="input font-mono text-sm" placeholder={"10: 4200\n50: 3900"} /><p className="hint mt-1">One per line: minimum quantity, then price each.</p></div>
          <div><label className="label" htmlFor="badge">Badge</label><input id="badge" name="badge" defaultValue={box?.badge ?? ""} className="input" placeholder="Best seller" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="sameDay" defaultChecked={box?.sameDay ?? true} className="h-4 w-4" /> Same-day delivery allowed</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={box?.featured} className="h-4 w-4" /> Show in best sellers</label>
          <div><label className="label" htmlFor="sortOrder">Sort order</label><input id="sortOrder" name="sortOrder" type="number" defaultValue={box?.sortOrder ?? 0} className="input" /></div>
        </section>
        <section className="card space-y-3 p-5">
          <div><label className="label" htmlFor="tags">Gift finder tags</label><input id="tags" name="tags" defaultValue={box?.tags ?? ""} className="input" placeholder="her, birthday, sweet, tea" /><p className="hint mt-1">Comma separated. Gift finder answers match these.</p></div>
          <h2 className="h2">Collections</h2>
          {groups.map((g) => (
            <fieldset key={g}>
              <legend className="label capitalize">{g.toLowerCase()}</legend>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {collections.filter((c) => c.kind === g).map((c) => (
                  <label key={c.id} className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="collection" value={c.id} defaultChecked={selected.includes(c.id)} />{c.name}</label>
                ))}
              </div>
            </fieldset>
          ))}
        </section>
        {s.error && <p role="alert" className="rounded-md bg-accent-soft p-3 text-sm text-accent-text">{s.error}</p>}
        {s.ok && <p className="rounded-md bg-brand-soft p-3 text-sm">Saved.</p>}
        <button className="btn-primary w-full" disabled={pending}>{pending ? "Saving…" : "Save box"}</button>
      </aside>
    </form>
  );
}
