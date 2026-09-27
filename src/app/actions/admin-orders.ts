"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { OrderStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { setOrderStatus, createOrder, orderContext } from "@/lib/orders";
import { saveImage } from "@/lib/uploads";
import { notify } from "@/lib/notify";
import { EVENTS, type NotifyEvent } from "@/lib/settings";

const id = (fd: FormData, k = "id") => Number(fd.get(k));

export async function changeStatus(fd: FormData) {
  await requireAdmin();
  await setOrderStatus(id(fd), String(fd.get("status")) as OrderStatus, String(fd.get("note") ?? "") || undefined);
  revalidatePath(`/admin/orders/${id(fd)}`);
}

export async function confirmPayment(fd: FormData) {
  await requireAdmin();
  const orderId = id(fd);
  const paid = fd.get("paid") === "1";
  await db.update(schema.payments).set({ status: paid ? "PAID" : "FAILED" }).where(eq(schema.payments.orderId, orderId));
  await db.insert(schema.orderEvents).values({ orderId, type: "payment", message: paid ? "Payment confirmed" : "Payment rejected" });
  if (paid) {
    const [o] = await db.select({ status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, orderId));
    if (o?.status === "PENDING") await setOrderStatus(orderId, "CONFIRMED");
  }
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updateDelivery(fd: FormData) {
  await requireAdmin();
  const orderId = id(fd);
  const patch: Partial<typeof schema.deliveries.$inferInsert> = {
    carrier: String(fd.get("carrier") ?? "") || null,
    tracking: String(fd.get("tracking") ?? "") || null,
  };
  const date = String(fd.get("date") ?? "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) patch.date = date;
  const slotId = Number(fd.get("slotId"));
  if (slotId) patch.slotId = slotId;
  const photo = await saveImage(fd.get("photo") as File | null, "deliveries", 1200);
  if (photo) patch.photo = photo;
  await db.update(schema.deliveries).set(patch).where(eq(schema.deliveries.orderId, orderId));
  await db.insert(schema.orderEvents).values({ orderId, type: "delivery", message: `Delivery updated${patch.date ? ` (date ${patch.date})` : ""}${photo ? ", photo added" : ""}` });
  if (fd.get("markDelivered") === "1") await setOrderStatus(orderId, "DELIVERED");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/deliveries");
}

export async function addNote(fd: FormData) {
  await requireAdmin();
  const note = String(fd.get("note") ?? "").trim();
  if (note) await db.insert(schema.orderEvents).values({ orderId: id(fd), type: "note", message: note });
  revalidatePath(`/admin/orders/${id(fd)}`);
}

export async function resendNotification(fd: FormData) {
  await requireAdmin();
  const ev = String(fd.get("event")) as NotifyEvent;
  if (!(ev in EVENTS)) return;
  const ctx = await orderContext(id(fd));
  if (ctx) await notify(ev, ctx);
  await db.insert(schema.orderEvents).values({ orderId: id(fd), type: "notification", message: `Re-sent: ${EVENTS[ev]}` });
  revalidatePath(`/admin/orders/${id(fd)}`);
}

export type ManualState = { error?: string };

export async function createManualOrder(_: ManualState, fd: FormData): Promise<ManualState> {
  await requireAdmin();
  const lines: { boxId?: number; addOnId?: number; name: string; unitPrice: number; quantity: number }[] = [];
  const boxIds = fd.getAll("boxId").map(Number);
  const qtys = fd.getAll("boxQty").map(Number);
  const boxRows = await db.select().from(schema.boxes);
  boxIds.forEach((bid, i) => {
    const b = boxRows.find((x) => x.id === bid);
    if (b && qtys[i] > 0) lines.push({ boxId: b.id, name: b.name, unitPrice: b.price, quantity: qtys[i] });
  });
  const customName = String(fd.get("customName") ?? "").trim();
  const customPrice = Number(fd.get("customPrice") ?? 0);
  if (customName && customPrice > 0) lines.push({ name: customName, unitPrice: customPrice, quantity: 1 });
  if (!lines.length) return { error: "Add at least one box or a custom item." };

  const req = (k: string) => String(fd.get(k) ?? "").trim();
  for (const k of ["customerName", "customerPhone", "recipientName", "recipientPhone", "address", "city", "date"]) if (!req(k)) return { error: `Fill in ${k.replace(/([A-Z])/g, " $1").toLowerCase()}.` };
  const zoneId = Number(fd.get("zoneId")) || null;
  let fee = Number(fd.get("fee"));
  if (!Number.isFinite(fee) || fd.get("fee") === "") {
    const [z] = zoneId ? await db.select().from(schema.deliveryZones).where(eq(schema.deliveryZones.id, zoneId)) : [];
    fee = z?.fee ?? 0;
  }
  const paid = fd.get("paid") === "on";
  const order = await createOrder({
    source: String(fd.get("source")) as (typeof schema.orderSource)[number],
    status: paid ? "CONFIRMED" : "PENDING",
    customer: { name: req("customerName"), phone: req("customerPhone"), email: req("customerEmail") || null },
    recipient: { name: req("recipientName"), phone: req("recipientPhone"), address: req("address"), city: req("city"), notes: req("notes") || null },
    lines,
    delivery: { date: req("date"), slotId: Number(fd.get("slotId")) || null, zoneId, fee },
    payment: { method: String(fd.get("payment")) === "COD" ? "COD" : "BANK_TRANSFER", status: paid ? "PAID" : "PENDING" },
    giftMessage: req("giftMessage") || null,
    surprise: fd.get("surprise") === "on",
    internalNote: req("internalNote") || null,
  });
  redirect(`/admin/orders/${order.orderId}`);
}
