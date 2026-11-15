// Writes the starter catalogue (catalogue.ts) as a SQL data migration, so a database that was set up before the
// revamp gets its home shelves, builder items and box styles on the next deploy, applied by the server itself.
//   npx tsx scripts/catalogue-sql.ts drizzle/0003_catalogue.sql
// Every statement only adds what is missing (matched by slug or name), so rows typed into the admin are left alone.
import { writeFileSync } from "node:fs";
import { STYLES, COLLECTIONS, ITEMS, BOXES } from "./catalogue";

const q = (v: string | number | boolean | null | undefined) =>
  v === null || v === undefined ? "NULL" : typeof v === "number" ? String(v) : typeof v === "boolean" ? (v ? "1" : "0")
  : "'" + v.replace(/\\/g, "\\\\").replace(/'/g, "''") + "'";

const out: string[] = [];

STYLES.forEach((s, i) => out.push(
  `INSERT INTO \`box_styles\` (\`name\`,\`outer_color\`,\`inner_color\`,\`sort_order\`) SELECT ${q(s.name)},${q(s.outer)},${q(s.inner)},${i + 1} FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM \`box_styles\` WHERE \`name\`=${q(s.name)});`));

for (const c of COLLECTIONS) {
  out.push(`INSERT IGNORE INTO \`collections\` (\`kind\`,\`slug\`,\`name\`,\`short_name\`,\`sort_order\`,\`show_on_home\`,\`date_rule\`,\`date_label\`,\`intro\`) VALUES (${[c.kind, c.slug, c.name, c.shortName, c.sortOrder, !!c.showOnHome, c.dateRule, c.dateLabel, c.intro].map(q).join(",")});`);
  // existing collections keep their words, but the shelves and year-dial dates switch on
  if (c.showOnHome) out.push(`UPDATE \`collections\` SET \`show_on_home\`=1 WHERE \`kind\`=${q(c.kind)} AND \`slug\`=${q(c.slug)};`);
  if (c.dateRule) out.push(`UPDATE \`collections\` SET \`date_rule\`=${q(c.dateRule)}, \`date_label\`=COALESCE(\`date_label\`,${q(c.dateLabel)}), \`short_name\`=COALESCE(\`short_name\`,${q(c.shortName)}) WHERE \`kind\`=${q(c.kind)} AND \`slug\`=${q(c.slug)} AND \`date_rule\` IS NULL;`);
}

ITEMS.forEach(([file, name, category, blurb], i) => {
  const img = `/catalog/items/${file}.webp`;
  out.push(`INSERT INTO \`items\` (\`name\`,\`category\`,\`blurb\`,\`image\`,\`builder_enabled\`,\`sort_order\`) SELECT ${[name, category, blurb, img].map(q).join(",")},1,${i + 1} FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM \`items\` WHERE \`name\`=${q(name)});`);
});

const itemByFile = new Map(ITEMS.map(([file, name]) => [file, name]));
const col = (slug: string) => `(SELECT \`id\` FROM \`collections\` WHERE \`slug\`=${q(slug)} ORDER BY \`id\` LIMIT 1)`;
const box = (slug: string) => `(SELECT \`id\` FROM \`boxes\` WHERE \`slug\`=${q(slug)})`;

BOXES.forEach((b, i) => {
  // Only boxes this migration creates get their photo, shelves and contents: an existing box with the same slug is the owner's.
  out.push(`SET @new := NOT EXISTS (SELECT 1 FROM \`boxes\` WHERE \`slug\`=${q(b.slug)});`);
  out.push(`INSERT INTO \`boxes\` (\`name\`,\`slug\`,\`summary\`,\`tagline\`,\`price\`,\`price_on_request\`,\`style_id\`,\`status\`,\`featured\`,\`tags\`,\`sort_order\`,\`created_at\`,\`updated_at\`) SELECT ${[b.name, b.slug, b.summary, b.tagline, b.price ?? 0, b.price === null].map(q).join(",")},(SELECT \`id\` FROM \`box_styles\` WHERE \`name\`=${q(b.style)} ORDER BY \`id\` LIMIT 1),'ACTIVE',${q(!!b.featured)},${q(b.tags)},${i + 1},NOW(),NOW() FROM DUAL WHERE @new;`);
  out.push(`INSERT INTO \`box_images\` (\`box_id\`,\`url\`,\`alt\`) SELECT ${box(b.slug)},${q(`/catalog/boxes/${b.slug}.webp`)},${q((b.alt ?? `${b.name}: ${b.summary}`).slice(0, 190))} FROM DUAL WHERE @new;`);
  for (const slug of b.in) out.push(`INSERT IGNORE INTO \`box_collections\` (\`box_id\`,\`collection_id\`) SELECT ${box(b.slug)},${col(slug)} FROM DUAL WHERE @new;`);
  b.items.forEach((file, n) => out.push(`INSERT IGNORE INTO \`box_contents\` (\`box_id\`,\`item_id\`,\`quantity\`,\`sort_order\`) SELECT ${box(b.slug)},(SELECT \`id\` FROM \`items\` WHERE \`name\`=${q(itemByFile.get(file)!)} ORDER BY \`id\` LIMIT 1),1,${n} FROM DUAL WHERE @new;`));
});

for (const c of COLLECTIONS) if (c.featured)
  out.push(`UPDATE \`collections\` SET \`featured_box_id\`=${box(c.featured)} WHERE \`slug\`=${q(c.slug)} AND \`featured_box_id\` IS NULL;`);

const file = process.argv[2];
if (!file) throw new Error("Usage: tsx scripts/catalogue-sql.ts <out.sql>");
writeFileSync(file, out.join("--> statement-breakpoint\n") + "\n");
console.log(`Wrote ${out.length} statements to ${file}`);
