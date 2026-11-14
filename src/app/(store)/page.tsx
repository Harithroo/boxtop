import "@/styles/home.css";
import { rs } from "@/lib/format";
import { getBuilderData, getSiteData, type HomeBox } from "@/lib/home-data";
import { Home } from "@/components/home/Home";
import type { HeroCard } from "@/components/home/Hero";

export const dynamic = "force-dynamic";

// What the hero shows if the catalogue has no featured boxes with photos yet.
const FALLBACK: HeroCard[] = [
  { img: "/catalog/boxes/gentleman.webp", alt: "Cream BOXTOP box on red satin with a silver watch, wallet, Axe spray, KitKat, Snickers and a rose", caption: "For him", price: null, href: null },
  { img: "/catalog/boxes/rose-satin.webp", alt: "Cream box with a rose-gold watch, satin scrunchies, body mist, a crochet bunny and a photo frame", caption: "Valentine's", price: null, href: null },
  { img: "/catalog/boxes/grand-red.webp", alt: "Large red box with a gold ribbon filled with Ferrero Rocher, Toblerone, Dairy Milk, KitKat, iced tea and satin scrunchies", caption: "Christmas red", price: null, href: null },
];
// The builder opens with a few things already in the box, when the catalogue has them.
const STARTER = ["Crochet bunny", "Long-stem rose", "Chocolate slab"];

const card = (b: HomeBox | undefined, n: number): HeroCard =>
  b?.img ? { img: b.img, alt: b.alt, caption: b.tagline || b.name, price: b.price === null ? null : rs(b.price), href: `/box/${b.slug}` } : FALLBACK[n];

export default async function HomePage() {
  const [site, builder] = await Promise.all([getSiteData(), getBuilderData()]);
  const f = site.featured;
  return (
    <Home
      today={site.today} wa={site.wa} waDisplay={site.waDisplay} instagram={site.instagram} igHandle={site.igHandle} facebook={site.facebook}
      hours={site.hours} payLine={site.payLine} proof={site.proof} areas={site.areas} quotes={site.quotes} abroad={site.abroad}
      fromPrice={site.minPrice === null ? null : rs(site.minPrice)}
      // the collage is laid out left to right: second featured box, first, (the café box), third
      hero={[card(f[1], 0), card(f[0], 1), card(f[2], 2)]}
      chapters={site.chapters} shelved={site.boxes.filter((b) => b.chapter && b.img)} boxes={site.boxes}
      occasions={site.occasions} occasionNames={site.occasionNames}
      items={builder.items} styles={builder.styles}
      starter={STARTER.map((name) => builder.items.find((i) => i.name === name)?.id).filter((id): id is number => id !== undefined)}
    />
  );
}
