import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

export const UPLOAD_DIR = path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? "./uploads");
const MAX_BYTES = 8 * 1024 * 1024;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif"];

/**
 * Save an uploaded image, resized once to WebP (cheap on shared hosting: no on-request optimisation).
 * Returns the public URL (/uploads/<folder>/<file>.webp) or null if no file.
 */
export async function saveImage(file: File | null, folder: "boxes" | "slips" | "enquiries" | "deliveries" | "content" | "reviews" | "items", maxWidth = 1600) {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new Error("Image is larger than 8 MB.");
  if (!OK_TYPES.includes(file.type)) throw new Error("Please upload a JPG, PNG or WebP image.");
  const buf = Buffer.from(await file.arrayBuffer());
  const out = await sharp(buf).rotate().resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(5).toString("hex")}.webp`;
  const dir = path.join(/* turbopackIgnore: true */ UPLOAD_DIR, folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), out);
  return `/uploads/${folder}/${name}`;
}
