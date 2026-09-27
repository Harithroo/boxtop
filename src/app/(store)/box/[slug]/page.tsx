import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getBoxBySlug, getAddOns } from "@/lib/catalog";
import { getZones } from "@/lib/delivery";
import { getSettings } from "@/lib/settings";
import { rs } from "@/lib/format";
import { GiftArt } from "@/components/GiftArt";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Stars } from "@/components/Stars";
import { BuyPanel } from "@/components/BuyPanel";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const b = await getBoxBySlug((await params).slug);
  if (!b) return {};
  return {
    title: b.seoTitle || b.name,
    description: b.seoDescription || b.summary || undefined,
    openGraph: { images: b.images[0] ? [b.images[0].url] : undefined },
  };
}

export default async function BoxPage({ params }: P) {
  const box = await getBoxBySlug((await params).slug);
  if (!box) notFound();
  const [zones, addOns, s, tiers, reviews] = await Promise.all([
    getZones(), getAddOns(), getSettings(),
    db.select().from(schema.priceTiers).where(eq(schema.priceTiers.boxId, box.id)).orderBy(asc(schema.priceTiers.minQty)),
    db.select().from(schema.reviews).where(and(eq(schema.reviews.boxId, box.id), eq(schema.reviews.approved, true))).orderBy(desc(schema.reviews.id)).limit(30),
  ]);
  const avg = reviews.length ? reviews.reduce((t, r) => t + r.rating, 0) / reviews.length : 0;
  const soldOut = box.stock !== null && box.stock <= 0;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://box-top.lk";
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: box.name, description: box.summary ?? undefined, sku: box.code ?? String(box.id),
    image: box.images.map((i) => site + i.url),
    ...(reviews.length ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: reviews.length } } : {}),
    offers: { "@type": "Offer", priceCurrency: "LKR", price: box.price, availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock", url: `${site}/box/${box.slug}` },
  };
  const makers = [...new Map(box.contents.map((c) => c.item.maker).filter(Boolean).map((m) => [m!.id, m!])).values()];

  return (
    <div className="container-bt py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="hint mb-4"><Link href="/shop" className="hover:text-brand">All boxes</Link> / {box.name}</nav>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="min-w-0">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-alt">
            {box.images[0] ? <Image src={box.images[0].url} alt={box.images[0].alt ?? box.name} fill priority sizes="(min-width:768px) 50vw, 100vw" className="object-cover" unoptimized /> : <GiftArt seed={box.id} className="h-full w-full" />}
          </div>
          {box.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {box.images.slice(1, 5).map((i) => (
                <div key={i.id} className="relative aspect-square overflow-hidden rounded-md bg-surface-alt">
                  <Image src={i.url} alt={i.alt ?? box.name} fill sizes="25vw" className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0">
          {box.code && <p className="eyebrow">Package {box.code.replace(/^P/, "")}</p>}
          <h1 className="h1">{box.name}</h1>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="price text-2xl">{rs(box.price)}</span>
            {box.compareAtPrice && box.compareAtPrice > box.price && <s className="text-ink-muted">{rs(box.compareAtPrice)}</s>}
            {box.badge && <span className="badge">{box.badge}</span>}
          </div>
          {reviews.length > 0 && <a href="#reviews" className="mt-2 flex items-center gap-2 text-sm"><Stars value={avg} /> <span className="text-ink-muted">{avg.toFixed(1)} · {reviews.length} review{reviews.length > 1 && "s"}</span></a>}
          {box.summary && <p className="mt-3 text-ink-muted">{box.summary}</p>}
          {tiers.length > 0 && (
            <div className="mt-4 rounded-md bg-brand-soft p-3 text-sm">
              <p className="font-bold">Buying several? Bulk prices apply automatically</p>
              <ul className="mt-1 flex flex-wrap gap-x-4">{tiers.map((t) => <li key={t.id}>{t.minQty}+ boxes: <b>{rs(t.unitPrice)}</b> each</li>)}</ul>
              <a href="/corporate/bulk" className="mt-1 inline-block font-bold text-brand">Send to many addresses →</a>
            </div>
          )}

          <div className="card mt-6 p-4 sm:p-5">
            <BuyPanel
              box={{ id: box.id, name: box.name, code: box.code, price: box.price, leadDays: box.leadDays, sameDay: box.sameDay, soldOut }}
              zones={zones.map((z) => ({ id: z.id, name: z.name, cities: z.cities, fee: z.fee }))}
              addOns={addOns.map((a) => ({ id: a.id, name: a.name, price: a.price }))}
              whatsapp={s.store.whatsapp}
            />
          </div>

          {box.contents.length > 0 && (
            <section className="mt-8">
              <h2 className="h2 mb-2">What&apos;s inside</h2>
              <ul className="divide-y divide-line rounded-lg bg-surface">
                {box.contents.map((c) => (
                  <li key={c.itemId} className="flex justify-between px-4 py-3 text-sm">
                    <span>{c.quantity > 1 && `${c.quantity} × `}{c.item.name}{c.item.maker && <span className="text-ink-muted"> · {c.item.maker.name}</span>}</span>
                    {c.item.size && <span className="text-ink-muted">{c.item.size}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {box.description && (
            <section className="mt-8">
              <h2 className="h2 mb-2">About this box</h2>
              <div className="whitespace-pre-line text-ink">{box.description}</div>
            </section>
          )}

          {makers.length > 0 && (
            <section className="mt-8">
              <h2 className="h2 mb-2">Made by</h2>
              {makers.map((m) => <p key={m.id} className="text-sm"><b>{m.name}</b>{m.place && `, ${m.place}`}. {m.story}</p>)}
            </section>
          )}

          <section id="reviews" className="mt-8">
            <h2 className="h2 mb-2">Reviews</h2>
            {reviews.length === 0 ? <p className="hint">No reviews yet. Reviews come from customers whose orders were delivered.</p> : (
              <ul className="space-y-3">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-lg bg-surface p-4">
                    <div className="flex items-center gap-2"><Stars value={r.rating} /><b className="text-sm">{r.name}</b><span className="hint">{r.createdAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span></div>
                    {r.body && <p className="mt-1 text-sm">{r.body}</p>}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {r.photo && <img src={r.photo} alt="Customer photo" className="mt-2 h-28 rounded-md object-cover" />}
                    {r.reply && <p className="mt-2 border-l-2 border-brand pl-3 text-sm text-ink-muted"><b>Boxtop:</b> {r.reply}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-8 rounded-lg bg-accent-soft p-4 text-sm">
            Want something different? <Link href="/custom" className="font-bold text-accent-text underline">Tell us who it&apos;s for</Link> and we&apos;ll build a custom box.
          </div>
        </div>
      </div>
    </div>
  );
}
