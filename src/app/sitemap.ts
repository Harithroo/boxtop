import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://box-top.lk";
  const [boxes, cols] = await Promise.all([
    db.select({ slug: schema.boxes.slug, updatedAt: schema.boxes.updatedAt }).from(schema.boxes).where(eq(schema.boxes.status, "ACTIVE")),
    db.select().from(schema.collections),
  ]);
  const staticPaths = ["", "/shop", "/build", "/gift-finder", "/vouchers", "/custom", "/corporate", "/corporate/bulk", "/delivery", "/faq", "/about", "/makers", "/contact"];
  return [
    ...staticPaths.map((p) => ({ url: `${site}${p}` })),
    ...cols.filter((c) => c.kind !== "CURATED").map((c) => ({ url: `${site}/${c.kind === "OCCASION" ? "occasion" : "for"}/${c.slug}` })),
    ...boxes.map((b) => ({ url: `${site}/box/${b.slug}`, lastModified: b.updatedAt })),
  ];
}
