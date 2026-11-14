import "@/styles/home.css";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { Builder } from "@/components/Builder";
import { Builder as QuoteBuilder } from "@/components/home/Builder";
import { getBuilderData, getSiteData } from "@/lib/home-data";

export const metadata = { title: "Build your own gift box", description: "Choose a box, fill it with treats and keepsakes, and we'll pack it by hand." };
export const dynamic = "force-dynamic";

const STARTER = ["Crochet bunny", "Long-stem rose", "Chocolate slab"];

export default async function Build() {
  const [sizes, priced, site, builder] = await Promise.all([
    db.select().from(schema.builderSizes).where(eq(schema.builderSizes.active, true)).orderBy(asc(schema.builderSizes.sortOrder)),
    // only items with a builder price can be bought outright
    db.select({ i: schema.items, maker: schema.makers.name }).from(schema.items).leftJoin(schema.makers, eq(schema.makers.id, schema.items.makerId))
      .where(and(eq(schema.items.builderEnabled, true), isNotNull(schema.items.builderPrice))).orderBy(asc(schema.items.sortOrder), asc(schema.items.name)),
    getSiteData(), getBuilderData(),
  ]);

  // Priced items and box sizes set up: buy a built box straight away.
  if (sizes.length && priced.length) {
    return (
      <div className="container-bt py-8">
        <p className="eyebrow">Build your own</p>
        <h1 className="h1">Make a box that&apos;s just for them</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">Pick a size, fill it with things they&apos;ll love, and we&apos;ll pack it by hand with your card. Want something we don&apos;t list? <Link href="/custom" className="tlink">Ask for a custom box</Link>.</p>
        <div className="mt-8">
          <Builder
            sizes={sizes.map((s) => ({ id: s.id, name: s.name, description: s.description, capacity: s.capacity, basePrice: s.basePrice, image: s.image, allowed: s.allowedItems ? s.allowedItems.split(",").map(Number).filter(Boolean) : null }))}
            items={priced.map(({ i, maker }) => ({ id: i.id, name: i.name, size: i.blurb ?? i.size, price: i.builderPrice ?? 0, image: i.image, category: i.category, stock: i.stock, maker }))}
          />
        </div>
      </div>
    );
  }

  // Otherwise the same builder as the home page: it ends in a WhatsApp message asking for a quote.
  return (
    <div className="home">
      <QuoteBuilder
        styles={builder.styles} items={builder.items} occasions={site.occasionNames} boxes={site.boxes}
        starter={STARTER.map((name) => builder.items.find((i) => i.name === name)?.id).filter((id): id is number => id !== undefined)}
        wa={site.wa} waDisplay={site.waDisplay}
      />
    </div>
  );
}
