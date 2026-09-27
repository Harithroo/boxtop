import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

/** Returns the discount on the subtotal (and whether delivery is free), or an error message. */
export async function applyCoupon(code: string, subtotal: number) {
  const c = code.trim().toUpperCase();
  if (!c) return { discount: 0, freeDelivery: false, code: null as string | null };
  const [row] = await db.select().from(schema.coupons).where(eq(schema.coupons.code, c));
  const now = new Date();
  if (!row || !row.active) return { error: "That code isn't valid." };
  if (row.startsAt && row.startsAt > now) return { error: "That code isn't active yet." };
  if (row.endsAt && row.endsAt < now) return { error: "That code has expired." };
  if (row.usageLimit !== null && row.used >= row.usageLimit) return { error: "That code has been used up." };
  if (subtotal < row.minSpend) return { error: `Spend Rs. ${row.minSpend.toLocaleString("en-LK")} to use this code.` };
  const discount = row.type === "PERCENT" ? Math.round((subtotal * row.value) / 100) : row.type === "FIXED" ? Math.min(row.value, subtotal) : 0;
  return { discount, freeDelivery: row.type === "FREE_DELIVERY", code: row.code };
}
