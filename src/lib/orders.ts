import "server-only";
import crypto from "node:crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { loadOrder } from "@/db/loaders";
import type { OrderStatus, PaymentMethod } from "@/db/schema";
import { notify, type NotifyContext } from "./notify";
import { lkPhone, prettyDate, STATUS_LABEL } from "./format";
import type { NotifyEvent } from "./settings";

export type NewOrderInput = {
  source?: (typeof schema.orderSource)[number];
  customer: { name: string; phone: string; email?: string | null; marketingConsent?: boolean };
  recipient: { name: string; phone: string; address: string; city: string; notes?: string | null };
  lines: {
    boxId?: number; addOnId?: number; name: string; unitPrice: number; quantity: number;
    builderSizeId?: number; meta?: { items?: { id: number; name: string; qty: number; price: number }[] };
  }[];
  delivery: { date: string; slotId: number | null; zoneId: number | null; fee: number };
  payment: { method: PaymentMethod; status?: (typeof schema.paymentStatus)[number] };
  discount?: number;
  couponCode?: string | null;
  giftMessage?: string | null;
  surprise?: boolean;
  callToArrange?: boolean;
  customerNote?: string | null;
  internalNote?: string | null;
  status?: OrderStatus;
  voucher?: { code: string; amount: number } | null;
  notifyChannels?: string[] | null;
  bulkRef?: string | null;
  quoteId?: number | null;
  skipNotify?: boolean;
};

async function nextNumber() {
  const [r] = await db.select({ max: sql<number>`coalesce(max(${schema.orders.id}), 0)` }).from(schema.orders);
  return `BX-${10234 + Number(r.max) + 1}`;
}

export async function createOrder(input: NewOrderInput) {
  const phone = lkPhone(input.customer.phone);
  const subtotal = input.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const discount = Math.min(input.discount ?? 0, subtotal);
  const total = subtotal - discount + input.delivery.fee;
  const voucherAmount = Math.min(input.voucher?.amount ?? 0, total);
  const payable = total - voucherAmount;

  const orderId = await db.transaction(async (tx) => {
    // upsert customer by phone
    const existing = await tx.select().from(schema.customers).where(eq(schema.customers.phone, phone));
    let customerId: number;
    if (existing[0]) {
      customerId = existing[0].id;
      await tx.update(schema.customers).set({
        // never overwrite a saved email from an unverified checkout
        name: existing[0].name || input.customer.name, email: existing[0].email || input.customer.email || null,
        marketingConsent: input.customer.marketingConsent ?? existing[0].marketingConsent,
      }).where(eq(schema.customers.id, customerId));
    } else {
      const [r] = await tx.insert(schema.customers).values({ name: input.customer.name, phone, email: input.customer.email || null, marketingConsent: !!input.customer.marketingConsent }).$returningId();
      customerId = r.id;
    }
    const [rec] = await tx.insert(schema.recipients).values({ ...input.recipient, phone: lkPhone(input.recipient.phone), customerId }).$returningId();

    let number = await nextNumber();
    let id = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const [o] = await tx.insert(schema.orders).values({
          number, customerId, recipientId: rec.id, source: input.source ?? "WEB", status: input.status ?? "PENDING",
          subtotal, deliveryFee: input.delivery.fee, discount, total, couponCode: input.couponCode ?? null,
          giftMessage: input.giftMessage || null, surprise: !!input.surprise, callToArrange: !!input.callToArrange,
          customerNote: input.customerNote || null, internalNote: input.internalNote || null,
          contactEmail: input.customer.email?.toLowerCase() || null,
          voucherCode: voucherAmount ? input.voucher!.code : null, voucherAmount, notifyChannels: input.notifyChannels ?? null,
          bulkRef: input.bulkRef ?? null, quoteId: input.quoteId ?? null, reviewToken: crypto.randomBytes(16).toString("hex"),
        }).$returningId();
        id = o.id;
        break;
      } catch (e) {
        if (attempt === 2) throw e;
        number = `BX-${Number(number.slice(3)) + 1 + attempt}`;
      }
    }

    await tx.insert(schema.orderLines).values(input.lines.map((l) => ({ ...l, orderId: id })));
    await tx.insert(schema.deliveries).values({ orderId: id, ...input.delivery });
    if (voucherAmount) {
      const [r] = await tx.update(schema.vouchers)
        .set({ balance: sql`${schema.vouchers.balance} - ${voucherAmount}`, status: sql`if(${schema.vouchers.balance} - ${voucherAmount} <= 0, 'USED', 'ACTIVE')` })
        .where(and(eq(schema.vouchers.code, input.voucher!.code), eq(schema.vouchers.status, "ACTIVE"), gte(schema.vouchers.balance, voucherAmount)));
      if (!r.affectedRows) throw new Error("VOUCHER_UNAVAILABLE");
      await tx.insert(schema.orderEvents).values({ orderId: id, type: "payment", message: `Gift voucher ${input.voucher!.code} used: Rs. ${voucherAmount}` });
    }
    await tx.insert(schema.payments).values(payable > 0
      ? { orderId: id, method: input.payment.method, amount: payable, status: input.payment.status ?? "PENDING" }
      : { orderId: id, method: "VOUCHER", amount: 0, status: "PAID" });
    await tx.insert(schema.orderEvents).values({ orderId: id, type: "created", message: `Order placed (${input.source ?? "WEB"})` });

    // stock
    for (const l of input.lines) {
      if (l.boxId) await tx.update(schema.boxes).set({ stock: sql`case when ${schema.boxes.stock} is null then null else greatest(${schema.boxes.stock} - ${l.quantity}, 0) end` }).where(eq(schema.boxes.id, l.boxId));
      for (const it of l.meta?.items ?? []) await tx.update(schema.items).set({ stock: sql`case when ${schema.items.stock} is null then null else greatest(${schema.items.stock} - ${it.qty * l.quantity}, 0) end` }).where(eq(schema.items.id, it.id));
      if (l.addOnId) await tx.update(schema.addOns).set({ stock: sql`case when ${schema.addOns.stock} is null then null else greatest(${schema.addOns.stock} - ${l.quantity}, 0) end` }).where(eq(schema.addOns.id, l.addOnId));
    }
    if (input.couponCode) await tx.update(schema.coupons).set({ used: sql`${schema.coupons.used} + 1` }).where(eq(schema.coupons.code, input.couponCode));
    return id;
  });

  const ctx = await orderContext(orderId);
  if (ctx && !input.skipNotify) await notify("order_placed", ctx);
  return ctx!;
}

export async function orderContext(orderId: number): Promise<(NotifyContext & { orderId: number; number: string }) | null> {
  const o = await loadOrder(eq(schema.orders.id, orderId));
  if (!o) return null;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://box-top.lk";
  return {
    orderId: o.id, number: o.number, total: o.total, customerName: o.customer.name, customerEmail: o.customer.email,
    customerPhone: o.customer.phone, deliveryDate: o.delivery ? prettyDate(o.delivery.date) : "", slot: o.delivery?.slot?.label ?? "",
    status: STATUS_LABEL[o.status], trackUrl: `${site}/track?order=${o.number}`,
    reviewUrl: o.reviewToken ? `${site}/review/${o.reviewToken}` : "", optIns: o.notifyChannels ?? null,
  };
}

const STATUS_EVENT: Partial<Record<OrderStatus, NotifyEvent>> = {
  CONFIRMED: "order_confirmed", PACKED: "order_packed", DISPATCHED: "order_dispatched", DELIVERED: "order_delivered", CANCELLED: "order_cancelled",
};

export async function setOrderStatus(orderId: number, status: OrderStatus, note?: string) {
  await db.update(schema.orders).set({ status }).where(eq(schema.orders.id, orderId));
  await db.insert(schema.orderEvents).values({ orderId, type: "status", message: `Status: ${STATUS_LABEL[status]}${note ? ` (${note})` : ""}` });
  if (status === "DELIVERED") {
    // COD is collected on delivery
    await db.update(schema.payments).set({ status: "PAID" }).where(sql`${schema.payments.orderId} = ${orderId} and ${schema.payments.method} = 'COD'`);
  }
  const ev = STATUS_EVENT[status];
  if (ev) {
    const ctx = await orderContext(orderId);
    if (ctx) await notify(ev, ctx);
  }
}

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED", CONFIRMED: "PACKED", PACKED: "DISPATCHED", DISPATCHED: "DELIVERED",
};
