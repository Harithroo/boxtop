// Makes the smaller copies of the photos in public/ that the pages ask for through srcset.
// Run it after adding or replacing a photo there:  node scripts/thumbs.mjs
// It only writes a copy that is missing or older than its original, so it is safe to run any time.
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const pub = path.join(import.meta.dirname, "..", "public");

/** [file, width of the copy, name of the copy] */
const jobs = [
  ["home/cafe-treat.webp", 480, "home/cafe-treat-480.webp"],
  ["home/birthday-mug.webp", 320, "home/birthday-mug-320.webp"],
  ["brand/logo.jpg", 96, "brand/logo-96.webp"],
  ["brand/logo.jpg", 192, "brand/logo-192.webp"],
];
// every seeded box photo gets a 400px copy (src/lib/srcset.ts points at it)
for (const f of await readdir(path.join(pub, "catalog/boxes"))) {
  if (f.endsWith(".webp") && !/-\d+\.webp$/.test(f)) jobs.push([`catalog/boxes/${f}`, 400, `catalog/boxes/${f.replace(/\.webp$/, "-400.webp")}`]);
}

const mtime = async (f) => { try { return (await stat(f)).mtimeMs; } catch { return 0; } };
for (const [from, width, to] of jobs) {
  const src = path.join(pub, from), out = path.join(pub, to);
  if ((await mtime(out)) >= (await mtime(src))) continue;
  const info = await sharp(src).resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
  console.log(`${to}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KiB`);
}
