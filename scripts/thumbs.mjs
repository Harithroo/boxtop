// Makes the smaller copies of the photos in public/ that the pages ask for through srcset.
// Run it after adding or replacing a photo there:  node scripts/thumbs.mjs
// It only writes a copy that is missing or older than its original, so it is safe to run any time.
// The sizes below are the ones src/lib/srcset.ts and the home components list; change both together.
//
// Two kinds of copy:
// - .webp at 400/480/320/96/192px: the first copies, still used as the fallback <img> for browsers without AVIF.
// - .avif at every size the pages show, plus one at full size: offered first through <picture>. At the same
//   look AVIF is about half the bytes of WebP, which matters most for the small, busy box photos.
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const pub = path.join(import.meta.dirname, "..", "public");
const photos = async (dir) => (await readdir(path.join(pub, dir))).filter((f) => f.endsWith(".webp") && !/-\d+\.webp$/.test(f));
const named = (f, w, ext) => f.replace(/\.webp$/, `${w ? `-${w}` : ""}.${ext}`);

/** [file, width of the copy (0 = as it is), name of the copy] */
const jobs = [
  ["home/cafe-treat.webp", 480, "home/cafe-treat-480.webp"],
  ["home/birthday-mug.webp", 320, "home/birthday-mug-320.webp"],
  ["brand/logo.jpg", 96, "brand/logo-96.webp"],
  ["brand/logo.jpg", 192, "brand/logo-192.webp"],
];
for (const w of [320, 480, 680, 0]) jobs.push(["home/cafe-treat.webp", w, named("home/cafe-treat.webp", w, "avif")]);
for (const w of [240, 320, 0]) jobs.push(["home/birthday-mug.webp", w, named("home/birthday-mug.webp", w, "avif")]);
// every seeded box photo: a hero print (240), a pegged card (400), a phone-width card (560)
for (const f of await photos("catalog/boxes")) {
  const p = `catalog/boxes/${f}`;
  jobs.push([p, 400, named(p, 400, "webp")]);
  for (const w of [240, 400, 560, 0]) jobs.push([p, w, named(p, w, "avif")]);
}
// builder items show at 100-180px
for (const f of await photos("catalog/items")) {
  const p = `catalog/items/${f}`;
  for (const w of [160, 0]) jobs.push([p, w, named(p, w, "avif")]);
}
// The cut-outs are drawn for the 900px café photo and always scale with it, so their small copies are made for a
// 680px photo: "-680" names the photo width they belong to, not their own width.
for (const f of await photos("home/cut")) {
  const p = `home/cut/${f}`;
  const { width } = await sharp(path.join(pub, p)).metadata();
  jobs.push([p, Math.round((width * 680) / 900), named(p, 680, "avif")], [p, 0, named(p, 0, "avif")]);
}

const mtime = async (f) => { try { return (await stat(f)).mtimeMs; } catch { return 0; } };
for (const [from, width, to] of jobs) {
  const src = path.join(pub, from), out = path.join(pub, to);
  if ((await mtime(out)) >= (await mtime(src))) continue;
  let img = sharp(src);
  if (width) img = img.resize({ width, withoutEnlargement: true });
  img = to.endsWith(".avif") ? img.avif({ quality: 50, effort: 5 }) : img.webp({ quality: 80 });
  const info = await img.toFile(out);
  console.log(`${to}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KiB`);
}
