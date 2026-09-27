"use server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { activateVoucher, voucherCode } from "@/lib/vouchers";
import { lkPhone } from "@/lib/format";

const n = (fd: FormData, k: string) => Number(fd.get(k) ?? 0) || 0;
const t = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// ---------- Gift finder ----------
export async function saveFinderQuestion(fd: FormData) {
  await requireAdmin();
  const id = n(fd, "id");
  const values = { question: t(fd, "question"), sortOrder: n(fd, "sortOrder") };
  if (!values.question) return;
  if (id) await db.update(schema.finderQuestions).set(values).where(eq(schema.finderQuestions.id, id));
  else await db.insert(schema.finderQuestions).values(values);
  revalidatePath("/admin/finder");
}
export async function deleteFinderQuestion(fd: FormData) {
  await requireAdmin();
  await db.delete(schema.finderQuestions).where(eq(schema.finderQuestions.id, n(fd, "id")));
  revalidatePath("/admin/finder");
}
export async function saveFinderAnswer(fd: FormData) {
  await requireAdmin();
  const id = n(fd, "id");
  const values = { questionId: n(fd, "questionId"), label: t(fd, "label"), tags: t(fd, "tags").toLowerCase().replace(/\s*,\s*/g, ","), sortOrder: n(fd, "sortOrder") };
  if (!values.label || !values.questionId) return;
  if (id) await db.update(schema.finderAnswers).set(values).where(eq(schema.finderAnswers.id, id));
  else await db.insert(schema.finderAnswers).values(values);
  revalidatePath("/admin/finder");
}
export async function deleteFinderAnswer(fd: FormData) {
  await requireAdmin();
  await db.delete(schema.finderAnswers).where(eq(schema.finderAnswers.id, n(fd, "id")));
  revalidatePath("/admin/finder");
}

// ---------- Reviews ----------
export async function moderateReview(fd: FormData) {
  await requireAdmin();
  const id = n(fd, "id");
  const op = t(fd, "op");
  if (op === "delete") await db.delete(schema.reviews).where(eq(schema.reviews.id, id));
  else await db.update(schema.reviews).set({ approved: op === "approve", reply: t(fd, "reply") || null }).where(eq(schema.reviews.id, id));
  revalidatePath("/admin/reviews");
  revalidatePath("/", "layout");
}

// ---------- Quotes ----------
export type QState = { error?: string; ok?: number };

export async function saveQuote(_: QState, fd: FormData): Promise<QState> {
  await requireAdmin();
  const id = n(fd, "id");
  const [q] = await db.select().from(schema.quotes).where(eq(schema.quotes.id, id));
  if (!q) return { error: "Quote not found." };
  if (q.status === "ACCEPTED") return { error: "This quote was accepted; change the order instead." };
  const names = fd.getAll("lineName").map(String), boxIds = fd.getAll("lineBox").map(Number), qtys = fd.getAll("lineQty").map(Number), prices = fd.getAll("linePrice").map(Number);
  const boxes = await db.select({ id: schema.boxes.id, name: schema.boxes.name }).from(schema.boxes);
  const lines = names.map((nm, i) => ({ quoteId: id, boxId: boxIds[i] || null, name: nm.trim() || boxes.find((b) => b.id === boxIds[i])?.name || "", quantity: qtys[i] || 0, unitPrice: prices[i] || 0 }))
    .filter((l) => l.name && l.quantity > 0);
  await db.delete(schema.quoteLines).where(eq(schema.quoteLines.quoteId, id));
  if (lines.length) await db.insert(schema.quoteLines).values(lines);
  await db.update(schema.quotes).set({
    deliveryFee: n(fd, "deliveryFee"), discount: n(fd, "discount"), notes: t(fd, "notes") || null,
    expiresAt: /^\d{4}-\d{2}-\d{2}$/.test(t(fd, "expiresAt")) ? t(fd, "expiresAt") : null,
  }).where(eq(schema.quotes.id, id));
  if (fd.get("send") === "1") {
    if (!lines.length) return { error: "Add at least one line before sending." };
    const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0) - n(fd, "discount") + n(fd, "deliveryFee");
    await db.update(schema.quotes).set({ status: "SENT" }).where(eq(schema.quotes.id, id));
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://box-top.lk";
    await notify("quote_sent", { number: q.number, total, customerName: q.contactName, customerEmail: q.email, customerPhone: q.phone, link: `${site}/quote/${q.token}` });
  }
  revalidatePath(`/admin/quotes/${id}`);
  return { ok: Date.now() };
}

export async function setQuoteStatus(fd: FormData) {
  await requireAdmin();
  const status = t(fd, "status") as (typeof schema.quoteStatus)[number];
  if (!schema.quoteStatus.includes(status) || status === "ACCEPTED") return;
  await db.update(schema.quotes).set({ status }).where(eq(schema.quotes.id, n(fd, "id")));
  revalidatePath(`/admin/quotes/${n(fd, "id")}`);
}

export async function newQuote(fd: FormData) {
  await requireAdmin();
  const [r] = await db.select({ max: sql<number>`coalesce(max(${schema.quotes.id}), 0)` }).from(schema.quotes);
  const [q] = await db.insert(schema.quotes).values({
    number: `QT-${1000 + Number(r.max) + 1}`, token: crypto.randomBytes(16).toString("hex"),
    contactName: t(fd, "contactName") || "Customer", company: t(fd, "company") || null, phone: lkPhone(t(fd, "phone") || "0"), email: t(fd, "email") || null, request: "Created in the back office",
  }).$returningId();
  redirect(`/admin/quotes/${q.id}`);
}

// ---------- Vouchers ----------
export async function voucherAction(fd: FormData) {
  await requireAdmin();
  const id = n(fd, "id");
  const op = t(fd, "op");
  if (op === "activate") await activateVoucher(id);
  if (op === "cancel") await db.update(schema.vouchers).set({ status: "CANCELLED" }).where(eq(schema.vouchers.id, id));
  revalidatePath("/admin/vouchers");
}

export async function createVoucher(fd: FormData) {
  await requireAdmin();
  const amount = n(fd, "amount");
  if (amount < 100) return;
  const [v] = await db.insert(schema.vouchers).values({
    code: voucherCode(), token: crypto.randomBytes(16).toString("hex"), amount, balance: amount,
    buyerName: t(fd, "buyerName") || "Boxtop", buyerPhone: lkPhone(t(fd, "buyerPhone") || "0"), buyerEmail: t(fd, "buyerEmail") || null,
    toName: t(fd, "toName") || null, toEmail: t(fd, "toEmail") || null, message: t(fd, "message") || null,
    paymentMethod: t(fd, "paymentMethod") === "CASH" ? "CASH" : t(fd, "paymentMethod") === "FREE" ? "FREE" : "BANK_TRANSFER",
  }).$returningId();
  if (fd.get("activate") === "on") await activateVoucher(v.id);
  revalidatePath("/admin/vouchers");
}

// ---------- Bulk orders: confirm the whole group's payment ----------
export async function confirmBulkPayment(fd: FormData) {
  await requireAdmin();
  const ref = t(fd, "ref");
  const orders = await db.select({ id: schema.orders.id, status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.bulkRef, ref));
  if (!orders.length) return;
  const ids = orders.map((o) => o.id);
  await db.update(schema.payments).set({ status: "PAID" }).where(inArray(schema.payments.orderId, ids));
  await db.update(schema.orders).set({ status: "CONFIRMED" }).where(and(inArray(schema.orders.id, ids), eq(schema.orders.status, "PENDING")));
  await db.insert(schema.orderEvents).values(ids.map((orderId) => ({ orderId, type: "payment", message: `Bulk ${ref} payment confirmed` })));
  const { orderContext } = await import("@/lib/orders");
  const ctx = await orderContext(ids[0]);
  if (ctx) await notify("order_confirmed", { ...ctx, number: `${ref} (${ids.length} deliveries)` });
  revalidatePath("/admin/orders");
}
