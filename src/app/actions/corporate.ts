"use server";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { saveImage } from "@/lib/uploads";
import { notify } from "@/lib/notify";
import { createOrder, orderContext } from "@/lib/orders";
import { findZoneForCity, colomboNow, addDays } from "@/lib/delivery";
import { getSettings } from "@/lib/settings";
import { parseCsv } from "@/lib/csv";
import { isLkMobile, lkPhone } from "@/lib/format";

export type CState = { ok?: boolean; error?: string; errors?: string[] };

// ---------- Quote request ----------
const Q = z.object({
  contactName: z.string().trim().min(2, "Enter your name"),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().refine(isLkMobile, "Enter a Sri Lankan mobile number"),
  email: z.string().trim().email("Enter a valid email").or(z.literal("")).optional(),
  quantity: z.coerce.number().int().min(1, "How many boxes?").max(100000),
  budget: z.string().trim().max(40).optional(),
  neededBy: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional(),
  branding: z.string().trim().max(160).optional(),
  request: z.string().trim().min(5, "Tell us a little about what you need").max(3000),
  website: z.string().max(0).optional(),
});

async function nextQuoteNumber() {
  const [r] = await db.select({ max: sql<number>`coalesce(max(${schema.quotes.id}), 0)` }).from(schema.quotes);
  return `QT-${1000 + Number(r.max) + 1}`;
}

export async function requestQuote(_: CState, fd: FormData): Promise<CState> {
  const p = Q.safeParse(Object.fromEntries(fd.entries()));
  if (!p.success) return { error: p.error.issues[0].message };
  const f = p.data;
  try {
    const photo = await saveImage(fd.get("photo") as File | null, "enquiries", 1400);
    const number = await nextQuoteNumber();
    await db.insert(schema.quotes).values({
      number, token: crypto.randomBytes(16).toString("hex"), contactName: f.contactName, company: f.company || null, phone: lkPhone(f.phone), email: f.email || null,
      quantity: f.quantity, budget: f.budget || null, neededBy: f.neededBy || null, branding: f.branding || null, request: f.request, photo,
    });
    await notify("quote_requested", { number, enquiryName: `${f.contactName}${f.company ? ` (${f.company})` : ""}` });
  } catch (e) { return { error: (e as Error).message }; }
  return { ok: true };
}

// ---------- Accept a quote ----------
export async function acceptQuote(_: CState, fd: FormData): Promise<CState> {
  const token = String(fd.get("token"));
  const [q] = await db.select().from(schema.quotes).where(eq(schema.quotes.token, token));
  if (!q || q.status !== "SENT") return { error: "This quote can't be accepted any more." };
  if (q.expiresAt && q.expiresAt < colomboNow().date) return { error: "This quote has expired. Ask us for an updated one." };
  const r = (k: string) => String(fd.get(k) ?? "").trim();
  if (!r("recipientName") || !isLkMobile(r("recipientPhone")) || r("address").length < 5 || !r("city")) return { error: "Fill in the delivery contact, mobile, address and city." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r("date")) || r("date") < colomboNow().date) return { error: "Choose a delivery date." };
  const lines = await db.select().from(schema.quoteLines).where(eq(schema.quoteLines.quoteId, q.id));
  if (!lines.length) return { error: "This quote has no items." };
  const zone = await findZoneForCity(r("city"));
  const order = await createOrder({
    source: "QUOTE",
    customer: { name: q.contactName, phone: q.phone, email: q.email },
    recipient: { name: r("recipientName"), phone: r("recipientPhone"), address: r("address"), city: r("city"), notes: r("notes") || null },
    lines: lines.map((l) => ({ boxId: l.boxId ?? undefined, name: l.name, unitPrice: l.unitPrice, quantity: l.quantity })),
    delivery: { date: r("date"), slotId: Number(fd.get("slotId")) || null, zoneId: zone?.id ?? null, fee: q.deliveryFee },
    payment: { method: "BANK_TRANSFER" },
    discount: q.discount,
    giftMessage: r("giftMessage") || null,
    internalNote: `From quote ${q.number}${q.company ? ` · ${q.company}` : ""}`,
    quoteId: q.id,
    notifyChannels: ["email", "sms"],
  });
  await db.update(schema.quotes).set({ status: "ACCEPTED", orderId: order.orderId }).where(eq(schema.quotes.id, q.id));
  await notify("quote_accepted", { number: q.number, enquiryName: q.company || q.contactName, orderId: order.orderId });
  (await cookies()).set(`bt_o_${order.number}`, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 60 });
  redirect(`/order/${order.number}`);
}

export async function declineQuote(fd: FormData) {
  const token = String(fd.get("token"));
  await db.update(schema.quotes).set({ status: "DECLINED" }).where(and(eq(schema.quotes.token, token), eq(schema.quotes.status, "SENT")));
  revalidatePath(`/quote/${token}`);
}

// ---------- Bulk order: one box to many addresses ----------
export async function placeBulkOrder(_: CState, fd: FormData): Promise<CState> {
  const r = (k: string) => String(fd.get(k) ?? "").trim();
  const boxId = Number(fd.get("boxId"));
  const perAddress = Math.max(1, Math.min(50, Number(fd.get("perAddress")) || 1));
  const date = r("date");
  const [box] = await db.select().from(schema.boxes).where(and(eq(schema.boxes.id, boxId), eq(schema.boxes.status, "ACTIVE")));
  if (!box) return { error: "Choose a box." };
  if (r("senderName").length < 2 || !isLkMobile(r("senderPhone"))) return { error: "Enter your name and mobile number." };
  const earliest = addDays(colomboNow().date, Math.max(2, box.leadDays));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < earliest) return { error: `Bulk orders need at least ${Math.max(2, box.leadDays)} days. Choose ${earliest} or later.` };
  const [blackout] = await db.select().from(schema.blackoutDates).where(eq(schema.blackoutDates.date, date));
  if (blackout) return { error: `We don't deliver on ${date} (${blackout.reason}).` };

  // CSV from file or pasted text
  const file = fd.get("csv") as File | null;
  const text = file && file.size ? await file.text() : r("pasted");
  if (!text) return { error: "Upload the address list (CSV) or paste it." };
  let rows = parseCsv(text);
  if (rows.length && /name/i.test(rows[0][0] ?? "")) rows = rows.slice(1);
  if (!rows.length) return { error: "The address list is empty." };
  if (rows.length > 500) return { error: "Up to 500 addresses per bulk order. Split the list, or ask us for a quote." };

  const errors: string[] = [];
  const zonesByCity = new Map<string, Awaited<ReturnType<typeof findZoneForCity>>>();
  const parsed = [];
  for (const [i, row] of rows.entries()) {
    const [name, phone, address, city, message] = row;
    const n = i + 1;
    if (!name || !phone || !address || !city) { errors.push(`Row ${n}: needs name, phone, address and city.`); continue; }
    if (!isLkMobile(phone)) { errors.push(`Row ${n}: "${phone}" isn't a Sri Lankan mobile number.`); continue; }
    const key = city.toLowerCase();
    if (!zonesByCity.has(key)) zonesByCity.set(key, await findZoneForCity(city));
    const zone = zonesByCity.get(key);
    if (!zone) { errors.push(`Row ${n}: we don't have "${city}" in our delivery areas yet.`); continue; }
    parsed.push({ name, phone, address, city, message: message || r("giftMessage") || null, zone });
  }
  if (errors.length) return { error: `${errors.length} row${errors.length > 1 ? "s need" : " needs"} fixing:`, errors: errors.slice(0, 20) };

  // tier price from the total quantity
  const totalQty = parsed.length * perAddress;
  const tiers = await db.select().from(schema.priceTiers).where(eq(schema.priceTiers.boxId, box.id));
  const unit = Math.min(box.price, ...tiers.filter((t) => totalQty >= t.minQty).map((t) => t.unitPrice));
  const s = await getSettings();
  if (!s.payments.bank.enabled) return { error: "Bulk orders are paid by bank transfer, which is switched off right now. Please contact us." };

  const bulkRef = `BK-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const created = [];
  for (const p of parsed) {
    created.push(await createOrder({
      source: "BULK", bulkRef, skipNotify: true,
      customer: { name: r("senderName"), phone: r("senderPhone"), email: r("senderEmail") || null },
      recipient: { name: p.name, phone: p.phone, address: p.address, city: p.city },
      lines: [{ boxId: box.id, name: box.name, unitPrice: unit, quantity: perAddress }],
      delivery: { date, slotId: Number(fd.get("slotId")) || null, zoneId: p.zone!.id, fee: p.zone!.fee },
      payment: { method: "BANK_TRANSFER" },
      giftMessage: p.message,
      notifyChannels: ["email"],
      internalNote: `Bulk ${bulkRef}${r("company") ? ` · ${r("company")}` : ""}`,
    }));
  }
  const first = await orderContext(created[0].orderId);
  const orders = await db.select({ total: schema.orders.total }).from(schema.orders).where(eq(schema.orders.bulkRef, bulkRef));
  await notify("order_placed", { ...first!, number: `${bulkRef} (${created.length} deliveries)`, total: orders.reduce((t, o) => t + o.total, 0) });
  (await cookies()).set(`bt_b_${bulkRef}`, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 60 });
  redirect(`/bulk/${bulkRef}`);
}

export async function uploadBulkSlip(_: CState, fd: FormData): Promise<CState> {
  const ref = String(fd.get("ref"));
  if ((await cookies()).get(`bt_b_${ref}`)?.value !== "1") return { error: "Please open this page from the link we sent." };
  const orders = await db.select({ id: schema.orders.id, number: schema.orders.number }).from(schema.orders).where(eq(schema.orders.bulkRef, ref));
  if (!orders.length) return { error: "Bulk order not found." };
  try {
    const slip = await saveImage(fd.get("slip") as File | null, "slips", 1400);
    if (!slip) return { error: "Choose a photo or screenshot of the slip." };
    await db.update(schema.payments).set({ slip, status: "SLIP_UPLOADED" }).where(inArray(schema.payments.orderId, orders.map((o) => o.id)));
  } catch (e) { return { error: (e as Error).message }; }
  const ctx = await orderContext(orders[0].id);
  if (ctx) await notify("slip_uploaded", { ...ctx, number: ref });
  revalidatePath(`/bulk/${ref}`);
  return { ok: true };
}
