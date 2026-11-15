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

import { STYLES, COLLECTIONS, ITEMS, BOXES } from "./catalogue";


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
