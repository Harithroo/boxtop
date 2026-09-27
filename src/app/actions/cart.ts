"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { readCart, writeCart } from "@/lib/cart";

const int = (v: FormDataEntryValue | null) => (v ? parseInt(String(v), 10) || 0 : 0);

export async function addToCart(fd: FormData) {
  const boxId = int(fd.get("boxId"));
  const q = Math.max(1, Math.min(20, int(fd.get("qty")) || 1));
  const c = await readCart();
  const line = c.lines.find((l) => l.b === boxId);
  if (line) line.q = Math.min(20, line.q + q);
  else c.lines.push({ b: boxId, q });
  for (const a of fd.getAll("addon").map((v) => int(v)).filter(Boolean)) {
    const ex = c.addons.find((x) => x.a === a);
    if (ex) ex.q += 1; else c.addons.push({ a, q: 1 });
  }
  const zoneId = int(fd.get("zoneId"));
  const date = String(fd.get("date") ?? "");
  const slotId = int(fd.get("slotId"));
  if (zoneId) c.zoneId = zoneId;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) c.date = date;
  if (slotId) c.slotId = slotId;
  await writeCart(c);
  redirect("/cart");
}

export async function updateLine(fd: FormData) {
  const kind = String(fd.get("kind"));
  const id = int(fd.get("id"));
  const q = int(fd.get("qty"));
  const c = await readCart();
  if (kind === "box") c.lines = c.lines.map((l) => (l.b === id ? { ...l, q } : l)).filter((l) => l.q > 0);
  else c.addons = c.addons.map((a) => (a.a === id ? { ...a, q } : a)).filter((a) => a.q > 0);
  await writeCart(c);
  revalidatePath("/cart");
}

export async function addBuild(fd: FormData) {
  const sizeId = int(fd.get("sizeId"));
  let items: [number, number][] = [];
  try { items = (JSON.parse(String(fd.get("items") ?? "[]")) as [number, number][]).filter(([a, b]) => Number.isInteger(a) && Number.isInteger(b) && b > 0).slice(0, 60); } catch {}
  if (!sizeId || !items.length) redirect("/build");
  const c = await readCart();
  c.builds = [...(c.builds ?? []), { k: Date.now().toString(36), s: sizeId, i: items, q: 1, m: String(fd.get("note") ?? "").slice(0, 200) || undefined }];
  await writeCart(c);
  redirect("/cart");
}

export async function updateBuild(fd: FormData) {
  const key = String(fd.get("key"));
  const q = int(fd.get("qty"));
  const c = await readCart();
  c.builds = (c.builds ?? []).map((b) => (b.k === key ? { ...b, q } : b)).filter((b) => b.q > 0);
  await writeCart(c);
  revalidatePath("/cart");
}

export async function addAddOn(fd: FormData) {
  const id = int(fd.get("id"));
  const c = await readCart();
  const ex = c.addons.find((a) => a.a === id);
  if (ex) ex.q += 1; else c.addons.push({ a: id, q: 1 });
  await writeCart(c);
  revalidatePath("/cart");
}
