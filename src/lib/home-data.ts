// Everything the store header, footer and home page read from the database, shaped for the browser.
// One request loads it once: the layout and the page share the result through React's cache().
import "server-only";
import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { loadBoxes } from "@/db/loaders";
import { colomboNow } from "./delivery";
import { igHandle, lkPhone, prettyPhone } from "./format";
import { daysBetween, longDate, nextDate, shortDate, whenText } from "./occasions";
import { getSettings } from "./settings";

export type HomeBox = {
  id: number; slug: string; name: string; summary: string; tagline: string | null;
  price: number | null; // null = ask for price
  img: string | null; alt: string;
  chapter: string | null; // the home shelf it hangs on (a collection slug)
  who: "Her" | "Him" | "Them"; occasion: string; styleId: number | null; // what the builder starts from
  items: number[]; // builder item ids, in the order they were listed
};
export type HomeChapter = { slug: string; name: string; href: string; count: number };
export type HomeItem = { id: number; name: string; group: string; blurb: string; img: string | null };
export type HomeStyle = { id: number; name: string; outer: string; inner: string };
export type HomeOccasion = {
  id: number; slug: string; name: string; short: string; href: string;
  date: string; days: number; when: string; dateText: string; dateShort: string;
  idea: string; img: string | null; boxId: number | null;
};
export type MenuPic = { img: string; cap: string };
export type SiteData = {
  today: string;
  wa: string; waDisplay: string; instagram: string; igHandle: string; facebook: string; address: string; hours: string;
  announcements: string[]; abroad: boolean; payLine: string; proof: string; areas: string[]; quotes: { text: string; by: string }[];
  boxes: HomeBox[]; shelfCount: number; minPrice: number | null;
  chapters: HomeChapter[]; featured: HomeBox[]; occasions: HomeOccasion[]; occasionNames: string[];
  menuPics: { shop: MenuPic | null; build: MenuPic | null; occasions: MenuPic | null; abroad: MenuPic | null; delivery: MenuPic | null };
};

const collectionHref = (c: { kind: string; slug: string }) =>
  c.kind === "OCCASION" ? `/occasion/${c.slug}` : c.kind === "RECIPIENT" ? `/for/${c.slug}` : `/collection/${c.slug}`;

export const getSiteData = cache(async (): Promise<SiteData> => {
  const [s, boxRows, cols, links, contents] = await Promise.all([
    getSettings(),
    loadBoxes(eq(schema.boxes.status, "ACTIVE"), [asc(schema.boxes.sortOrder), asc(schema.boxes.id)]),
    db.select().from(schema.collections).orderBy(asc(schema.collections.sortOrder), asc(schema.collections.id)),
    db.select().from(schema.boxCollections),
    db.select({ boxId: schema.boxContents.boxId, itemId: schema.boxContents.itemId })
      .from(schema.boxContents)
      .innerJoin(schema.items, eq(schema.items.id, schema.boxContents.itemId))
      .where(eq(schema.items.builderEnabled, true))
      .orderBy(asc(schema.boxContents.sortOrder), asc(schema.boxContents.itemId)),
  ]);
  const today = colomboNow().date;
  const colById = new Map(cols.map((c) => [c.id, c]));
  const homeCols = cols.filter((c) => c.showOnHome);
  const occasionCols = cols.filter((c) => c.kind === "OCCASION");
  const label = (c: { name: string; shortName: string | null }) => c.shortName || c.name;

  const boxes: HomeBox[] = boxRows.map((b) => {
    const mine = links.filter((l) => l.boxId === b.id).map((l) => colById.get(l.collectionId)).filter((c) => !!c);
    const slugs = new Set(mine.filter((c) => c.kind === "RECIPIENT").map((c) => c.slug));
    // A box hangs on one shelf. An occasion or a curated shelf says more about it than "for her", so it wins.
    const shelves = homeCols.filter((h) => mine.some((c) => c.id === h.id));
    const shelf = shelves.find((c) => c.kind !== "RECIPIENT") ?? shelves[0];
    const occ = occasionCols.find((o) => mine.some((c) => c.id === o.id));
    const img = b.images[0];
    return {
      id: b.id, slug: b.slug, name: b.name, summary: b.summary ?? "", tagline: b.tagline,
      price: b.priceOnRequest ? null : b.price,
      img: img?.url ?? null, alt: img?.alt || [b.name, b.summary].filter(Boolean).join(": "),
      chapter: shelf?.slug ?? null,
      who: slugs.has("her") && !slugs.has("him") ? "Her" : slugs.has("him") && !slugs.has("her") ? "Him" : "Them",
      occasion: occ ? label(occ) : "Just because",
      styleId: b.styleId,
      items: contents.filter((c) => c.boxId === b.id).map((c) => c.itemId),
    };
  });

  // The home shelves only hang boxes that have a photo: the whole strip is photographs.
  const shelved = boxes.filter((b) => b.chapter && b.img);
  const chapters: HomeChapter[] = homeCols
    .map((c) => ({ slug: c.slug, name: c.name, href: collectionHref(c), count: shelved.filter((b) => b.chapter === c.slug).length }))
    .filter((c) => c.count > 0);

  const withPhoto = boxes.filter((b) => b.img);
  const featuredIds = new Set(boxRows.filter((b) => b.featured).map((b) => b.id));
  const featured = withPhoto.filter((b) => featuredIds.has(b.id));
  const others = withPhoto.filter((b) => !featuredIds.has(b.id));
  const at = (list: HomeBox[], i: number) => (list.length ? list[i % list.length] : withPhoto.length ? withPhoto[i % withPhoto.length] : null);
  const pic = (b: HomeBox | null): MenuPic | null => (b?.img ? { img: b.img, cap: b.name } : null);

  const occasions: HomeOccasion[] = occasionCols
    .map((c) => ({ c, date: nextDate(c.dateRule, today) }))
    .filter((x): x is { c: (typeof occasionCols)[number]; date: string } => !!x.date)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map(({ c, date }) => {
      const days = daysBetween(today, date);
      const box = boxes.find((b) => b.id === c.featuredBoxId) ?? null;
      return {
        id: c.id, slug: c.slug, name: c.name, short: label(c), href: collectionHref(c),
        date, days, when: whenText(days), dateText: c.dateLabel || longDate(date), dateShort: c.dateLabel || shortDate(date),
        idea: c.intro ?? "", img: box?.img ?? c.image ?? null, boxId: box?.id ?? null,
      };
    });

  const wa = s.store.whatsapp ? lkPhone(s.store.whatsapp) : "";
  const waDisplay = s.store.whatsapp ? prettyPhone(s.store.whatsapp) : "";
  const { cod, bank } = s.payments;
  const payLine = cod.enabled && bank.enabled ? "Cash on delivery or bank transfer" : cod.enabled ? "Cash on delivery" : "Bank transfer";
  const next = occasions[0];
  const announcements = [
    next ? `Next up: ${next.name} · ${next.when.toLowerCase()}` : "Gift boxes, packed by hand",
    ...s.store.announcement.split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
    wa ? `Order on WhatsApp · ${waDisplay}` : "",
    payLine,
    s.home.abroad ? "Sending from abroad? We time it to Sri Lanka" : "",
  ].filter(Boolean);

  const priced = boxes.filter((b) => b.price !== null).map((b) => b.price as number);
  return {
    today,
    wa, waDisplay, instagram: s.store.instagram, igHandle: igHandle(s.store.instagram), facebook: s.store.facebook, address: s.store.address, hours: s.store.hours,
    announcements, abroad: s.home.abroad, payLine, proof: s.home.proof, areas: s.home.areas, quotes: s.home.quotes,
    boxes, shelfCount: shelved.length, minPrice: priced.length ? Math.min(...priced) : null,
    chapters,
    featured: [at(featured, 0), at(featured, 1), at(featured, 2)].filter((b, i, all): b is HomeBox => !!b && all.findIndex((x) => x?.id === b.id) === i),
    occasions, occasionNames: occasionCols.map(label),
    menuPics: { shop: pic(at(featured, 0)), build: pic(at(others, 3)), occasions: pic(at(featured, 2)), abroad: pic(at(others, 4)), delivery: pic(at(featured, 1)) },
  };
});

/** The builder's shelves: what can go in a box, and the boxes it can go in. */
export const getBuilderData = cache(async (): Promise<{ items: HomeItem[]; styles: HomeStyle[] }> => {
  const [items, styles] = await Promise.all([
    db.select().from(schema.items).where(eq(schema.items.builderEnabled, true)).orderBy(asc(schema.items.sortOrder), asc(schema.items.name)),
    db.select().from(schema.boxStyles).where(eq(schema.boxStyles.active, true)).orderBy(asc(schema.boxStyles.sortOrder), asc(schema.boxStyles.id)),
  ]);
  return {
    items: items.map((i) => ({ id: i.id, name: i.name, group: i.category || "More", blurb: i.blurb || i.size || "", img: i.image })),
    styles: styles.map((x) => ({ id: x.id, name: x.name, outer: x.outer, inner: x.inner })),
  };
});
