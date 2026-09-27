import "server-only";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { notify } from "./notify";
import { addDays, colomboNow } from "./delivery";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
export function voucherCode() {
  const b = crypto.randomBytes(8);
  const s = [...b].map((x) => ALPHA[x % ALPHA.length]).join("");
  return `BT-${s.slice(0, 4)}-${s.slice(4)}`;
}

export async function activateVoucher(id: number) {
  const [v] = await db.select().from(schema.vouchers).where(eq(schema.vouchers.id, id));
  if (!v || v.status !== "PENDING") return;
  const expiresAt = addDays(colomboNow().date, 365);
  await db.update(schema.vouchers).set({ status: "ACTIVE", expiresAt }).where(eq(schema.vouchers.id, id));
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://box-top.lk";
  const toEmail = v.toEmail || v.buyerEmail;
  const toPhone = v.toPhone || v.buyerPhone;
  await notify("voucher_issued", {
    customerName: v.toName || v.buyerName, customerEmail: toEmail, customerPhone: toPhone, code: v.code, amount: v.amount,
    text: `${v.message ? `"${v.message}" from ${v.buyerName}. ` : v.toName ? `From ${v.buyerName}. ` : ""}Valid until ${expiresAt}.`, link: `${site}/vouchers/${v.token}`,
  });
}
