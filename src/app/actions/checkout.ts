"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { loadCart, clearCart } from "@/lib/cart";
import { isSlotAvailable } from "@/lib/delivery";
import { applyCoupon } from "@/lib/coupons";
import { getSettings } from "@/lib/settings";
import { createOrder } from "@/lib/orders";
import { isLkMobile } from "@/lib/format";

export type CheckoutState = { error?: string; fields?: Record<string, string> };

const Form = z.object({
  senderName: z.string().trim().min(2, "Enter your name"),
  senderPhone: z.string().trim().refine(isLkMobile, "Enter a Sri Lankan mobile number, e.g. 077 123 4567"),
  senderEmail: z.string().trim().email("Enter a valid email").or(z.literal("")),
  recipientName: z.string().trim().min(2, "Enter the recipient's name"),
  recipientPhone: z.string().trim().refine(isLkMobile, "Enter the recipient's mobile number"),
  address: z.string().trim().min(6, "Enter the delivery address"),
  city: z.string().trim().min(2, "Choose the delivery city"),
  zoneId: z.coerce.number().int().positive("Choose the delivery city"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a delivery date"),
  slotId: z.coerce.number().int().positive("Choose a time slot"),
  giftMessage: z.string().max(300, "Keep the card message under 300 characters").optional(),
  notes: z.string().max(500).optional(),
  payment: z.enum(["COD", "BANK_TRANSFER"], { message: "Choose how you'll pay" }).optional(),
  coupon: z.string().optional(),
  voucher: z.string().optional(),
});

export async function placeOrder(_: CheckoutState, fd: FormData): Promise<CheckoutState> {
  const raw = Object.fromEntries(fd.entries()) as Record<string, string>;
  const parsed = Form.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: raw };
  const f = parsed.data;

  const cart = await loadCart();
  if (cart.empty) return { error: "Your cart is empty." };

  const [zone] = await db.select().from(schema.deliveryZones).where(eq(schema.deliveryZones.id, f.zoneId));
  if (!zone || !zone.active) return { error: "We don't deliver to that area yet.", fields: raw };
  if (!(await isSlotAvailable(zone.id, f.date, f.slotId, cart.leadDays, cart.sameDayOk)))
    return { error: "That delivery slot just filled up or closed. Please pick another.", fields: raw };

  const coupon = await applyCoupon(f.coupon ?? "", cart.subtotal);
  if ("error" in coupon) return { error: coupon.error, fields: raw };
  const fee = coupon.freeDelivery ? 0 : zone.fee;
  const total = cart.subtotal - coupon.discount + fee;

  // gift voucher (can cover part or all of the total)
  let voucher: { code: string; amount: number } | null = null;
  const vcode = (f.voucher ?? "").trim().toUpperCase();
  if (vcode) {
    const [v] = await db.select().from(schema.vouchers).where(eq(schema.vouchers.code, vcode));
    if (!v || v.status !== "ACTIVE" || v.balance <= 0) return { error: "That gift voucher code isn't valid or has no balance left.", fields: raw };
    if (v.expiresAt && v.expiresAt < new Date().toISOString().slice(0, 10)) return { error: "That gift voucher has expired.", fields: raw };
    voucher = { code: v.code, amount: Math.min(v.balance, total) };
  }
  const payable = total - (voucher?.amount ?? 0);

  const s = await getSettings();
  if (payable > 0 && !f.payment) return { error: "Choose how you'll pay", fields: raw };
  if (payable > 0 && f.payment === "COD") {
    if (!s.payments.cod.enabled || !zone.codAllowed) return { error: "Cash on delivery isn't available for this area. Please choose bank transfer.", fields: raw };
    if (s.payments.cod.maxOrder && payable > s.payments.cod.maxOrder) return { error: `Cash on delivery is for orders up to Rs. ${s.payments.cod.maxOrder.toLocaleString("en-LK")}. Please choose bank transfer.`, fields: raw };
  }
  if (payable > 0 && f.payment === "BANK_TRANSFER" && !s.payments.bank.enabled) return { error: "Bank transfer isn't available right now.", fields: raw };

  const optIns = ["email", "sms", "whatsapp"].filter((c) => raw[`notify_${c}`] === "on");
  let order;
  try {
  order = await createOrder({
    customer: { name: f.senderName, phone: f.senderPhone, email: f.senderEmail || null, marketingConsent: raw.marketing === "on" },
    recipient: { name: f.recipientName, phone: f.recipientPhone, address: f.address, city: f.city, notes: f.notes || null },
    lines: [
      ...cart.lines.map((l) => ({ boxId: l.box.id, name: l.box.name, unitPrice: l.unit, quantity: l.q })),
      ...cart.builds.map((b) => ({ builderSizeId: b.size.id, name: `Build your own box (${b.size.name})`, unitPrice: b.unit, quantity: b.q, meta: { items: b.contents } })),
      ...cart.addons.map((a) => ({ addOnId: a.addOn.id, name: a.addOn.name, unitPrice: a.addOn.price, quantity: a.q })),
    ],
    delivery: { date: f.date, slotId: f.slotId, zoneId: zone.id, fee },
    payment: { method: f.payment ?? "BANK_TRANSFER" },
    discount: coupon.discount,
    couponCode: coupon.code,
    giftMessage: f.giftMessage,
    surprise: raw.surprise === "on",
    callToArrange: raw.callToArrange === "on",
    voucher,
    notifyChannels: optIns,
    customerNote: cart.builds.map((b) => b.note).filter(Boolean).join(" / ") || null,
  });
  } catch (e) {
    if ((e as Error).message === "VOUCHER_UNAVAILABLE") return { error: "That gift voucher was just used. Please try again without it.", fields: raw };
    throw e;
  }

  await clearCart();
  // lets this browser see the full order page without re-entering the phone
  (await cookies()).set(`bt_o_${order.number}`, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  redirect(`/order/${order.number}`);
}
