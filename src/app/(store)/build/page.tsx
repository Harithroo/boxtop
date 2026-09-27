import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { Builder } from "@/components/Builder";

export const metadata = { title: "Build your own gift box", description: "Choose a box, fill it with treats from Sri Lankan makers, and we'll pack it by hand." };
export const dynamic = "force-dynamic";

export default async function Build() {
  const [sizes, items] = await Promise.all([
    db.select().from(schema.builderSizes).where(eq(schema.builderSizes.active, true)).orderBy(asc(schema.builderSizes.sortOrder)),
    db.select({ i: schema.items, maker: schema.makers.name }).from(schema.items).leftJoin(schema.makers, eq(schema.makers.id, schema.items.makerId))
      .where(eq(schema.items.builderEnabled, true)).orderBy(asc(schema.items.sortOrder), asc(schema.items.name)),
  ]);
  return (
    <div className="container-bt py-8">
      <p className="eyebrow">Build your own</p>
      <h1 className="h1">Make a box that&apos;s just for them</h1>
      <p className="mt-2 max-w-2xl text-ink-muted">Pick a size, fill it with things they&apos;ll love, and we&apos;ll pack it by hand with your card. Want something we don&apos;t list? <Link href="/custom" className="font-bold text-brand">Ask for a custom box</Link>.</p>
      <div className="mt-6">
        {sizes.length && items.length ? (
          <Builder
            sizes={sizes.map((s) => ({ id: s.id, name: s.name, description: s.description, capacity: s.capacity, basePrice: s.basePrice, image: s.image, allowed: s.allowedItems ? s.allowedItems.split(",").map(Number).filter(Boolean) : null }))}
            items={items.map(({ i, maker }) => ({ id: i.id, name: i.name, size: i.size, price: i.builderPrice ?? 0, image: i.image, category: i.category, stock: i.stock, maker }))}
          />
        ) : <p className="card p-6 text-ink-muted">The box builder is being stocked. Check back soon, or <Link href="/custom" className="font-bold text-brand">ask us for a custom box</Link>.</p>}
      </div>
    </div>
  );
}
