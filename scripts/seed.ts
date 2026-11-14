// Seeds the owner account and starter data. Safe to re-run: skips anything that already exists.
//   npm run db:seed
import "dotenv/config";

// Show where we're connecting (never the password)
{ const u = new URL(process.env.DATABASE_URL ?? "mysql://missing"); console.log(`Database: ${decodeURIComponent(u.username)} @ ${u.hostname}:${u.port || 3306}/${u.pathname.slice(1)}`); }
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db, schema } from "../src/db";

async function once<T>(label: string, exists: () => Promise<unknown[]>, run: () => Promise<T>) {
  if ((await exists()).length) return console.log(`· ${label}: already there`);
  await run();
  console.log(`✓ ${label}`);
}

// ---------- The home page catalogue ----------
// Photos, names and prices come from Boxtop's own Facebook and Instagram posts (2023–24).
// Names are placeholders and prices may have moved: check both in the back office before launch.

const STYLES = [
  { name: "Navy lid box", outer: "#22388f", inner: "#c99f72" },
  { name: "Cream gift box", outer: "#ece0c8", inner: "#f7efe0" },
  { name: "Red ribbon box", outer: "#b61f2e", inner: "#dcc09a" },
];

type Kind = (typeof schema.collectionKind)[number];
type Col = { kind: Kind; slug: string; name: string; shortName?: string; sortOrder: number; showOnHome?: boolean; dateRule?: string; dateLabel?: string; intro?: string; featured?: string };

// Occasions are listed in the order the builder offers them. The ones with a date rule appear on the year dial.
const COLLECTIONS: Col[] = [
  { kind: "RECIPIENT", slug: "her", name: "For her", sortOrder: 0, showOnHome: true },
  { kind: "RECIPIENT", slug: "him", name: "For him", sortOrder: 1, showOnHome: true },
  { kind: "RECIPIENT", slug: "mum", name: "For mum", sortOrder: 2 },
  { kind: "RECIPIENT", slug: "dad", name: "For dad", sortOrder: 3 },
  { kind: "RECIPIENT", slug: "kids", name: "For kids", sortOrder: 4 },
  { kind: "RECIPIENT", slug: "colleagues", name: "For colleagues", sortOrder: 5 },

  { kind: "OCCASION", slug: "birthday", name: "Birthday", sortOrder: 0 },
  { kind: "OCCASION", slug: "anniversary", name: "Anniversary", sortOrder: 1 },
  { kind: "OCCASION", slug: "valentines", name: "Valentine's Day", shortName: "Valentine's", sortOrder: 2, dateRule: "fixed:02-14", featured: "rose-satin",
    intro: "A rose, a card and something to keep. Our Facebook page is full of these." },
  { kind: "OCCASION", slug: "convocation", name: "Convocation", sortOrder: 3, showOnHome: true },
  { kind: "OCCASION", slug: "christmas", name: "Christmas", sortOrder: 4, dateRule: "fixed:12-25", featured: "grand-red",
    intro: "A red box with a gold ribbon and enough chocolate to share." },
  { kind: "OCCASION", slug: "deepavali", name: "Deepavali", sortOrder: 5, dateRule: "list:2026-11-08,2027-10-28", featured: "chocolate-red",
    intro: "Sweets for the family visits, and something bright for the hosts." },
  { kind: "OCCASION", slug: "avurudu", name: "Sinhala & Tamil New Year", shortName: "Avurudu", sortOrder: 6, dateRule: "fixed:04-13", dateLabel: "13–14 April", featured: "cafe-treat",
    intro: "Treats for the visits: cookies, cold brew and sweets for the table." },
  { kind: "OCCASION", slug: "mothers-day", name: "Mother's Day", sortOrder: 7, dateRule: "nth:5-0-2", featured: "rosegold-hour",
    intro: "Rose-gold watch, body mist and a slab of her favourite chocolate." },
  { kind: "OCCASION", slug: "fathers-day", name: "Father's Day", sortOrder: 8, dateRule: "nth:6-0-3", featured: "gentleman",
    intro: "A watch, a wallet and a body spray, with a rose for good measure." },
  { kind: "OCCASION", slug: "thank-you", name: "Thank you", sortOrder: 9 },
  { kind: "OCCASION", slug: "just-because", name: "Just because", sortOrder: 10 },

  { kind: "CURATED", slug: "sweet-tooth", name: "Sweet tooth", sortOrder: 4, showOnHome: true },
  { kind: "CURATED", slug: "small-gestures", name: "Small gestures", sortOrder: 5, showOnHome: true },
];

// [photo file, name, group, one-line detail]. The group is the heading the builder files it under.
const ITEMS: [string, string, string, string][] = [
  ["watch-rosegold", "Rose-gold watch", "Keepsakes", "Boxed, in its case"],
  ["watch-silver", "Silver watch", "Keepsakes", "Boxed, in its case"],
  ["teddy", "Teddy bear", "Keepsakes", "Holding a heart"],
  ["crochet-bunny", "Crochet bunny", "Keepsakes", "Made by hand"],
  ["photo-frame", "Photo frame", "Keepsakes", "Add your own photo"],
  ["scrunchies", "Satin scrunchies", "Keepsakes", "A set of three"],
  ["perfume", "Men's perfume", "Pamper", "Yacht Man"],
  ["body-spray", "Body spray", "Pamper", "Axe Dark Temptation"],
  ["body-mist", "Body mist", "Pamper", "Floral and light"],
  ["hand-cream", "Hand cream", "Pamper", "A small luxury"],
  ["ferrero", "Ferrero Rocher", "Treats", "Three, in gold"],
  ["chocolate", "Chocolate slab", "Treats", "Dairy Milk"],
  ["cookies", "Sesame cookies", "Treats", "Hope · made in Sri Lanka"],
  ["cold-brew", "Iced coffee", "Treats", "Soul cold brew"],
  ["iced-tea", "Iced tea", "Treats", "Dilmah"],
  ["rose", "Long-stem rose", "Finishing touches", "In cellophane"],
  ["card", "Greeting card", "Finishing touches", "With your note"],
];

type SeedBox = {
  slug: string; name: string; price: number | null; style: string; summary: string; in: string[]; items: string[];
  tagline?: string; featured?: boolean; alt?: string; tags: string;
};
// `in` lists collection slugs: who it's for, the occasion, and (where it has one) its shelf on the home page.
const BOXES: SeedBox[] = [
  { slug: "rose-satin", name: "Rose & Satin", price: 6300, style: "Cream gift box", in: ["her", "valentines"], featured: true, tagline: "Valentine's", tags: "her,valentines,anniversary",
    summary: "Rose-gold watch, satin scrunchies, body mist, crochet bunny, photo frame, rose",
    alt: "Cream box with a rose-gold watch, satin scrunchies, body mist, a crochet bunny and a photo frame",
    items: ["watch-rosegold", "scrunchies", "body-mist", "crochet-bunny", "photo-frame", "rose", "chocolate"] },
  { slug: "rosegold-hour", name: "Rose-Gold Hour", price: 9500, style: "Navy lid box", in: ["her", "birthday"], tags: "her,birthday,mum",
    summary: "Rose-gold watch, body mist, roast almond slab, Twix, KitKat, barbecue chips",
    items: ["watch-rosegold", "body-mist", "chocolate"] },
  { slug: "bunny-blackforest", name: "Bunny & Black Forest", price: 5200, style: "Navy lid box", in: ["her", "valentines"], tags: "her,valentines,anniversary",
    summary: "Crochet bunny, Black Forest slab, \"I love you\" frame, lotion, rose, card",
    items: ["crochet-bunny", "chocolate", "photo-frame", "rose", "card"] },
  { slug: "bunny-pamper", name: "Bunny Pamper", price: 5100, style: "Navy lid box", in: ["her", "just-because"], tags: "her,get-well",
    summary: "Crochet bunny, body lotion, deodorant, chocolate bars, rose, card",
    items: ["crochet-bunny", "chocolate", "rose", "card"] },
  { slug: "gentleman", name: "The Gentleman", price: 5000, style: "Cream gift box", in: ["him", "valentines"], featured: true, tagline: "For him", tags: "him,valentines,anniversary,dad",
    summary: "Silver watch, leather wallet, body spray, KitKat, Snickers, rose, card",
    alt: "Cream BOXTOP box on red satin with a silver watch, wallet, Axe spray, KitKat, Snickers and a rose",
    items: ["watch-silver", "body-spray", "chocolate", "rose", "card"] },
  { slug: "yacht-club", name: "Yacht Club", price: 6100, style: "Cream gift box", in: ["him", "birthday"], tags: "him,birthday,dad",
    summary: "Men's perfume, silver watch, photo frame, Ferrero Rocher, KitKat, Snickers",
    items: ["perfume", "watch-silver", "photo-frame", "ferrero", "chocolate"] },
  { slug: "teddy-loveyou", name: "Teddy Says Love You", price: 5600, style: "Navy lid box", in: ["him", "valentines"], tags: "him,valentines,anniversary",
    summary: "Teddy with a heart, silver watch, body spray, Kinder Bueno, KitKat, rose, card",
    items: ["teddy", "watch-silver", "body-spray", "chocolate", "rose", "card"] },
  { slug: "convocation-mist", name: "Graduate & Rose Mist", price: 9300, style: "Navy lid box", in: ["her", "convocation"], tags: "her,graduation",
    summary: "Graduation teddy, watch, body mist, Dairy Milk, Ferrero, Bueno, Toblerone, KitKat",
    items: ["teddy", "watch-silver", "body-mist", "ferrero", "chocolate"] },
  { slug: "convocation-classic", name: "Convocation Classic", price: null, style: "Navy lid box", in: ["him", "convocation"], tags: "him,graduation",
    summary: "Graduation teddy, body spray, Toblerone, Ferrero, Dairy Milk, Bueno, peanuts",
    items: ["teddy", "body-spray", "ferrero", "chocolate"] },
  { slug: "grand-red", name: "The Grand Red", price: 10800, style: "Red ribbon box", in: ["sweet-tooth", "christmas"], featured: true, tagline: "Christmas red", tags: "christmas,thank-you,colleague,corporate",
    summary: "Gold-ribbon red box: Dairy Milk, Ferrero, dark chocolate, wafers, satin scrunchies, iced tea, rose",
    alt: "Large red box with a gold ribbon filled with Ferrero Rocher, Toblerone, Dairy Milk, KitKat, iced tea and satin scrunchies",
    items: ["chocolate", "ferrero", "scrunchies", "iced-tea", "rose", "card"] },
  { slug: "chocolate-red", name: "Chocolate Red", price: 5200, style: "Red ribbon box", in: ["sweet-tooth", "just-because"], tags: "thank-you,kids,colleague",
    summary: "Gold-ribbon red box: Dairy Milk, Kinder Bueno, Toblerone, dark chocolate, rose, card",
    items: ["chocolate", "rose", "card"] },
  { slug: "cafe-treat", name: "Café Treat", price: null, style: "Navy lid box", in: ["sweet-tooth", "thank-you"], tags: "thank-you,colleague,corporate",
    summary: "Hope sesame cookies, Soul cold brew, Dilmah iced tea, marshmallows, Ferrero, Bueno, KitKat",
    alt: "Open navy BOXTOP box with Hope cookies, Soul cold brew, Dilmah iced tea, marshmallows, Ferrero Rocher, Richlife cheese spread, KitKat and Kinder Bueno",
    items: ["cookies", "cold-brew", "iced-tea", "ferrero", "chocolate"] },
  { slug: "scrunchie-treat", name: "Scrunchie Treat", price: 2700, style: "Navy lid box", in: ["her", "small-gestures", "just-because"], tags: "her,thank-you,kids",
    summary: "Satin scrunchies, chocolate bars, body lotion, rose, card",
    items: ["scrunchies", "chocolate", "rose", "card"] },
];

async function seedCatalogue() {
  // 1. The boxes a gift can come in
  await db.insert(schema.boxStyles).values(STYLES.map((s, i) => ({ ...s, sortOrder: i + 1 })));
  const styles = await db.select().from(schema.boxStyles);

  // 2. Collections. Existing ones are kept and brought up to date; only the listed ones sit on the home page.
  await db.update(schema.collections).set({ showOnHome: false });
  for (const c of COLLECTIONS) {
    const [ex] = await db.select().from(schema.collections).where(and(eq(schema.collections.kind, c.kind), eq(schema.collections.slug, c.slug)));
    const fields = { name: c.name, shortName: c.shortName ?? null, sortOrder: c.sortOrder, showOnHome: !!c.showOnHome, dateRule: c.dateRule ?? null, dateLabel: c.dateLabel ?? null };
    if (ex) await db.update(schema.collections).set({ ...fields, intro: ex.intro ?? c.intro ?? null }).where(eq(schema.collections.id, ex.id));
    else await db.insert(schema.collections).values({ kind: c.kind, slug: c.slug, ...fields, intro: c.intro ?? null });
  }
  const cols = await db.select().from(schema.collections);
  const colId = (slug: string) => {
    const c = cols.find((x) => x.slug === slug);
    if (!c) throw new Error(`Seed: no collection "${slug}"`);
    return c.id;
  };

  // 3. Items, matched by name so nothing is doubled if some were typed in already
  const itemIds = new Map<string, number>();
  for (const [i, [file, name, category, blurb]] of ITEMS.entries()) {
    const [ex] = await db.select().from(schema.items).where(eq(schema.items.name, name));
    const fields = { category, blurb, image: `/catalog/items/${file}.webp`, builderEnabled: true, sortOrder: i + 1 };
    if (ex) { await db.update(schema.items).set({ ...fields, image: ex.image ?? fields.image }).where(eq(schema.items.id, ex.id)); itemIds.set(file, ex.id); }
    else itemIds.set(file, (await db.insert(schema.items).values({ name, ...fields }).$returningId())[0].id);
  }

  // 4. The photographed boxes
  const boxIds = new Map<string, number>();
  for (const [i, b] of BOXES.entries()) {
    const [ex] = await db.select().from(schema.boxes).where(eq(schema.boxes.slug, b.slug));
    if (ex) { boxIds.set(b.slug, ex.id); continue; }
    const [{ id }] = await db.insert(schema.boxes).values({
      name: b.name, slug: b.slug, summary: b.summary, tagline: b.tagline ?? null, price: b.price ?? 0, priceOnRequest: b.price === null,
      styleId: styles.find((s) => s.name === b.style)!.id, status: "ACTIVE", featured: !!b.featured, tags: b.tags, sortOrder: i + 1,
    }).$returningId();
    boxIds.set(b.slug, id);
    await db.insert(schema.boxImages).values({ boxId: id, url: `/catalog/boxes/${b.slug}.webp`, alt: b.alt ?? `${b.name}: ${b.summary}`.slice(0, 190) });
    await db.insert(schema.boxCollections).values(b.in.map((slug) => ({ boxId: id, collectionId: colId(slug) })));
    await db.insert(schema.boxContents).values(b.items.map((file, n) => ({ boxId: id, itemId: itemIds.get(file)!, quantity: 1, sortOrder: n })));
  }

  // 5. The box we suggest for each dated occasion
  for (const c of COLLECTIONS) {
    if (c.featured && boxIds.has(c.featured)) await db.update(schema.collections).set({ featuredBoxId: boxIds.get(c.featured)! }).where(eq(schema.collections.id, colId(c.slug)));
  }
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || password.length < 8) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ chars) in .env first.");

  await once("owner account", () => db.select().from(schema.users).where(eq(schema.users.email, email)), async () =>
    db.insert(schema.users).values({ name: "Owner", email, passwordHash: await bcrypt.hash(password, 12), role: "owner" }));

  await once("delivery zones", () => db.select().from(schema.deliveryZones), () => db.insert(schema.deliveryZones).values([
    { name: "Piliyandala and nearby", cities: "Piliyandala,Kesbewa,Maharagama,Boralesgamuwa,Kottawa,Homagama,Moratuwa,Dehiwala,Mount Lavinia,Ratmalana", fee: 350, sameDay: true, sortOrder: 1 },
    { name: "Colombo 1–15", cities: "Colombo 1,Colombo 2,Colombo 3,Colombo 4,Colombo 5,Colombo 6,Colombo 7,Colombo 8,Colombo 9,Colombo 10,Colombo 11,Colombo 12,Colombo 13,Colombo 14,Colombo 15", fee: 500, sameDay: true, sortOrder: 2 },
    { name: "Greater Colombo", cities: "Nugegoda,Kotte,Battaramulla,Rajagiriya,Malabe,Kaduwela,Wattala,Kelaniya,Kiribathgoda,Panadura,Kadawatha,Ja-Ela", fee: 700, sameDay: true, sortOrder: 3 },
    { name: "Outstation (courier)", cities: "Negombo,Gampaha,Kalutara,Kandy,Galle,Matara,Kurunegala,Ratnapura,Anuradhapura,Jaffna,Trincomalee,Batticaloa,Badulla,Nuwara Eliya", fee: 950, sameDay: false, leadDays: 2, codAllowed: false, sortOrder: 4 },
  ]));

  await once("time slots", () => db.select().from(schema.deliverySlots), () => db.insert(schema.deliverySlots).values([
    { label: "Morning, 9am to 12pm", startTime: "09:00", endTime: "12:00", cutoff: "07:00", capacity: 15, sortOrder: 1 },
    { label: "Afternoon, 12pm to 4pm", startTime: "12:00", endTime: "16:00", cutoff: "10:00", capacity: 15, sortOrder: 2 },
    { label: "Evening, 4pm to 8pm", startTime: "16:00", endTime: "20:00", cutoff: "13:00", capacity: 10, sortOrder: 3 },
  ]));

  await once("home page catalogue (box styles, collections, items, boxes)", () => db.select().from(schema.boxStyles), seedCatalogue);

  await once("add-ons", () => db.select().from(schema.addOns), () => db.insert(schema.addOns).values([
    { name: "Greeting card", price: 250, sortOrder: 1 },
    { name: "Helium balloon", price: 900, sortOrder: 2 },
    { name: "Ferrero Rocher (3 pcs)", price: 750, sortOrder: 3 },
    { name: "Small teddy bear", price: 1200, sortOrder: 4 },
  ]));

  await once("box sizes for build-your-own", () => db.select().from(schema.builderSizes), () => db.insert(schema.builderSizes).values([
    { name: "Small", capacity: 4, basePrice: 1500, description: "A neat little box", sortOrder: 1 },
    { name: "Medium", capacity: 7, basePrice: 2200, description: "Our most popular size", sortOrder: 2 },
    { name: "Large", capacity: 12, basePrice: 3200, description: "A proper hamper", sortOrder: 3 },
  ]));

  await once("gift finder questions", () => db.select().from(schema.finderQuestions), async () => {
    const q = async (question: string, sortOrder: number, answers: [string, string][]) => {
      const [r] = await db.insert(schema.finderQuestions).values({ question, sortOrder }).$returningId();
      await db.insert(schema.finderAnswers).values(answers.map(([label, tags], i) => ({ questionId: r.id, label, tags, sortOrder: i })));
    };
    await q("Who is it for?", 1, [["Her", "her"], ["Him", "him"], ["Mum", "mum,her"], ["Dad", "dad,him"], ["Kids", "kids"], ["A colleague", "colleague,corporate"]]);
    await q("What's the occasion?", 2, [["Birthday", "birthday"], ["Anniversary", "anniversary"], ["Valentine's", "valentines"], ["Graduation", "graduation"], ["Thank you", "thank-you"], ["Just because", ""]]);
    await q("What's your budget?", 3, [["Under Rs 5,000", "price:0-4999"], ["Rs 5,000–10,000", "price:5000-10000"], ["Rs 10,000–20,000", "price:10000-20000"], ["Rs 20,000+", "price:20000-"]]);
  });

  await once("pages", () => db.select().from(schema.pages), () => db.insert(schema.pages).values([
    { slug: "about", title: "About Boxtop", body: "Boxtop is a gift shop in Piliyandala, Colombo. We pack every box by hand and deliver across Colombo and Sri Lanka.\n\nEdit this page in the back office under Content." },
    { slug: "terms", title: "Terms of sale", body: "Replace this with your terms before launch." },
    { slug: "privacy", title: "Privacy", body: "Replace this with your privacy notice before launch (Sri Lanka Personal Data Protection Act)." },
    { slug: "refunds", title: "Refunds and replacements", body: "Replace this with your refund and replacement policy before launch." },
    { slug: "delivery-policy", title: "Delivery policy", body: "Replace this with your delivery policy before launch." },
  ]));

  await once("FAQ", () => db.select().from(schema.faqs), () => db.insert(schema.faqs).values([
    { question: "How do I pay?", answer: "Cash on delivery (in areas where it's offered) or bank transfer. For bank transfer, upload the slip after ordering and we confirm your order.", sortOrder: 1 },
    { question: "Can I choose the delivery date and time?", answer: "Yes. Pick a date and time slot at checkout. Same-day delivery is available in Colombo and nearby areas if you order before the cut-off time.", sortOrder: 2 },
    { question: "Can you make a custom box?", answer: "Yes. Build one on the home page and send it to us on WhatsApp, or use the custom order page with the occasion, budget and what they love.", sortOrder: 3 },
    { question: "Will you include a message?", answer: "Every order can include a printed card with your message. Add it at checkout.", sortOrder: 4 },
    { question: "I live abroad. Can I send a box to someone in Sri Lanka?", answer: "Yes. Message us on WhatsApp from wherever you are, pay by bank transfer and send a photo of the slip. We deliver within Sri Lanka only, and confirm the delivery day in Sri Lanka time.", sortOrder: 5 },
  ]));

  console.log("\nDone. Sign in at /admin/login with", email);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
