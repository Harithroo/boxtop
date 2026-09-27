// Seeds the owner account and starter data. Safe to re-run: skips anything that already exists.
//   npm run db:seed
import "dotenv/config";

// Show where we're connecting (never the password)
{ const u = new URL(process.env.DATABASE_URL ?? "mysql://missing"); console.log(`Database: ${decodeURIComponent(u.username)} @ ${u.hostname}:${u.port || 3306}/${u.pathname.slice(1)}`); }
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db";

async function once<T>(label: string, exists: () => Promise<unknown[]>, run: () => Promise<T>) {
  if ((await exists()).length) return console.log(`· ${label}: already there`);
  await run();
  console.log(`✓ ${label}`);
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

  await once("collections", () => db.select().from(schema.collections), () => db.insert(schema.collections).values([
    ...["Birthday", "Anniversary", "Thank you", "New baby", "Get well", "Graduation", "Corporate", "Avurudu", "Christmas", "Valentine's"].map((name, i) => ({
      kind: "OCCASION" as const, name, slug: name.toLowerCase().replace(/'/g, "").replace(/\s+/g, "-"), sortOrder: i, showOnHome: i < 6,
    })),
    ...["For her", "For him", "For mum", "For dad", "For kids", "For colleagues"].map((name, i) => ({
      kind: "RECIPIENT" as const, name, slug: name.replace("For ", "").toLowerCase(), sortOrder: i,
    })),
  ]));

  await once("add-ons", () => db.select().from(schema.addOns), () => db.insert(schema.addOns).values([
    { name: "Greeting card", price: 250, sortOrder: 1 },
    { name: "Helium balloon", price: 900, sortOrder: 2 },
    { name: "Ferrero Rocher (3 pcs)", price: 750, sortOrder: 3 },
    { name: "Small teddy bear", price: 1200, sortOrder: 4 },
  ]));

  await once("starter boxes", () => db.select().from(schema.boxes), async () => {
    const cols = await db.select().from(schema.collections);
    const col = (slug: string) => cols.find((c) => c.slug === slug)!.id;
    const add = async (b: typeof schema.boxes.$inferInsert, colSlugs: string[]) => {
      const [r] = await db.insert(schema.boxes).values(b).$returningId();
      if (colSlugs.length) await db.insert(schema.boxCollections).values(colSlugs.map((s) => ({ boxId: r.id, collectionId: col(s) })));
    };
    // From Boxtop's current Facebook catalogue (check contents and prices)
    await add({ name: "Package 15", slug: "package-15", code: "P15", price: 4650, status: "ACTIVE", featured: true, badge: "Best seller",
      summary: "A ladies' watch, chocolates and a teddy in a gift box", tags: "her,birthday,anniversary", sortOrder: 1 }, ["birthday", "her", "anniversary"]);
    await add({ name: "Watch gift box", slug: "watch-gift-box", price: 4000, status: "ACTIVE", featured: true,
      summary: "A watch with chocolates, boxed and ribboned", tags: "him,her,birthday", sortOrder: 2 }, ["birthday", "him", "her"]);
    await add({ name: "Graduation box", slug: "graduation-box", price: 0, status: "DRAFT",
      summary: "Set the price and contents before publishing", sortOrder: 3 }, ["graduation"]);
  });

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
    await q("What's the occasion?", 2, [["Birthday", "birthday"], ["Anniversary", "anniversary"], ["Thank you", "thank-you"], ["New baby", "new-baby"], ["Get well", "get-well"], ["Just because", ""]]);
    await q("What's your budget?", 3, [["Under Rs. 5,000", "price:0-4999"], ["Rs. 5,000–10,000", "price:5000-10000"], ["Rs. 10,000–20,000", "price:10000-20000"], ["Rs. 20,000+", "price:20000-"]]);
  });

  await once("pages", () => db.select().from(schema.pages), () => db.insert(schema.pages).values([
    { slug: "about", title: "About Boxtop", body: "Boxtop is a gift shop in Piliyandala. We pack every box by hand and deliver across Colombo and Sri Lanka.\n\nEdit this page in the back office under Content." },
    { slug: "terms", title: "Terms of sale", body: "Replace this with your terms before launch." },
    { slug: "privacy", title: "Privacy", body: "Replace this with your privacy notice before launch (Sri Lanka Personal Data Protection Act)." },
    { slug: "refunds", title: "Refunds and replacements", body: "Replace this with your refund and replacement policy before launch." },
    { slug: "delivery-policy", title: "Delivery policy", body: "Replace this with your delivery policy before launch." },
  ]));

  await once("FAQ", () => db.select().from(schema.faqs), () => db.insert(schema.faqs).values([
    { question: "How do I pay?", answer: "Cash on delivery (in areas where it's offered) or bank transfer. For bank transfer, upload the slip after ordering and we confirm your order.", sortOrder: 1 },
    { question: "Can I choose the delivery date and time?", answer: "Yes. Pick a date and time slot at checkout. Same-day delivery is available in Colombo and nearby areas if you order before the cut-off time.", sortOrder: 2 },
    { question: "Can you make a custom box?", answer: "Yes. Use the custom order page or message us on WhatsApp with the occasion, budget and what they love.", sortOrder: 3 },
    { question: "Will you include a message?", answer: "Every order can include a printed card with your message. Add it at checkout.", sortOrder: 4 },
  ]));

  console.log("\nDone. Sign in at /admin/login with", email);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
