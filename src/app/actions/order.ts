"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { loadOrder } from "@/db/loaders";
import { currentCustomer } from "@/lib/customer-auth";
import { lkPhone } from "@/lib/format";
import { saveImage } from "@/lib/uploads";
import { notify } from "@/lib/notify";
import { orderContext } from "@/lib/orders";

export async function canView(number: string) {
  if ((await cookies()).get(`bt_o_${number}`)?.value === "1") return true;
  // signed-in customer who owns the order (email sign-ins: only orders placed with that email)
  const c = await currentCustomer();
  if (!c) return false;
  const [o] = await db.select({ cid: schema.orders.customerId, email: schema.orders.contactEmail }).from(schema.orders).where(eq(schema.orders.number, number));
  return !!o && o.cid === c.id && (!c.via.includes("@") || o.email === c.via);
}

export async function trackOrder(_: { error?: string }, fd: FormData): Promise<{ error?: string }> {
  const number = String(fd.get("order") ?? "").trim().toUpperCase().replace(/^(\d)/, "BX-$1");
  const phone = lkPhone(String(fd.get("phone") ?? ""));
  const o = await loadOrder(eq(schema.orders.number, number));
  if (!o || (o.customer.phone !== phone && o.recipient.phone !== phone)) return { error: "We couldn't find an order with that number and phone." };
  (await cookies()).set(`bt_o_${number}`, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  redirect(`/order/${number}`);
}

export async function uploadSlip(_: { error?: string; ok?: boolean }, fd: FormData): Promise<{ error?: string; ok?: boolean }> {
  const number = String(fd.get("number"));
  if (!(await canView(number))) return { error: "Please open this order from the tracking page first." };
  const o = await loadOrder(eq(schema.orders.number, number));
  const p = o?.payments.find((x) => x.method === "BANK_TRANSFER");
  if (!o || !p) return { error: "This order isn't paid by bank transfer." };
  try {
    const url = await saveImage(fd.get("slip") as File | null, "slips", 1400);
    if (!url) return { error: "Choose a photo or screenshot of the slip." };
    await db.update(schema.payments).set({ slip: url, status: "SLIP_UPLOADED" }).where(and(eq(schema.payments.id, p.id)));
    await db.insert(schema.orderEvents).values({ orderId: o.id, type: "payment", message: "Bank slip uploaded by customer" });
    const ctx = await orderContext(o.id);
    if (ctx) await notify("slip_uploaded", ctx);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/order/${number}`);
  return { ok: true };
}
