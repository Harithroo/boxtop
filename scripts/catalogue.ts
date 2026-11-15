// The starter home-page catalogue. Read by seed.ts (fresh databases) and catalogue-sql.ts (writes the data migration).
import type { collectionKind } from "../src/db/schema";

// ---------- The home page catalogue ----------
// Photos, names and prices come from Boxtop's own Facebook and Instagram posts (2023–24).
// Names are placeholders and prices may have moved: check both in the back office before launch.

export const STYLES = [
  { name: "Navy lid box", outer: "#22388f", inner: "#c99f72" },
  { name: "Cream gift box", outer: "#ece0c8", inner: "#f7efe0" },
  { name: "Red ribbon box", outer: "#b61f2e", inner: "#dcc09a" },
];

export type Kind = (typeof collectionKind)[number];
export type Col = { kind: Kind; slug: string; name: string; shortName?: string; sortOrder: number; showOnHome?: boolean; dateRule?: string; dateLabel?: string; intro?: string; featured?: string };

// Occasions are listed in the order the builder offers them. The ones with a date rule appear on the year dial.
export const COLLECTIONS: Col[] = [
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
export const ITEMS: [string, string, string, string][] = [
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

export type SeedBox = {
  slug: string; name: string; price: number | null; style: string; summary: string; in: string[]; items: string[];
  tagline?: string; featured?: boolean; alt?: string; tags: string;
};
// `in` lists collection slugs: who it's for, the occasion, and (where it has one) its shelf on the home page.
export const BOXES: SeedBox[] = [
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
