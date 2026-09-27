"use server";
import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { voucherCode } from "@/lib/vouchers";
import { notify } from "@/lib/notify";
import { saveImage } from "@/lib/uploads";
import { isLkMobile, lkPhone } from "@/lib/format";

export type VState = { error?: string; ok?: boolean };

const V = z.object({
  amount: z.coerce.number().int().min(1000, "Vouchers start at Rs. 1,000").max(200000),
  buyerName: z.string().trim().min(2, "Enter your name"),
  buyerPhone: z.string().trim().refine(isLkMobile, "Enter your mobile number"),
  buyerEmail: z.string().trim().email("Enter your email").or(z.literal("")),
  toName: z.string().trim().max(120).optional(),
  toEmail: z.string().trim().email("Check the recipient's email").or(z.literal("")).optional(),
  message: z.string().trim().max(300).optional(),
});

export async function buyVoucher(_: VState, fd: FormData): Promise<VState> {
  const raw = Object.fromEntries(fd.entries());
  if (raw.amount === "custom") raw.amount = raw.customAmount;
  const p = V.safeParse(raw);
  if (!p.success) return { error: p.error.issues[0].message };
  const f = p.data;
  if (!f.buyerEmail && !f.toEmail) return { error: "Add an email so we can send the voucher code." };
  const token = crypto.randomBytes(16).toString("hex");
  let code = voucherCode();
  for (let i = 0; i < 3; i++) {
    try {
      await db.insert(schema.vouchers).values({ code, token, amount: f.amount, balance: f.amount, buyerName: f.buyerName, buyerPhone: lkPhone(f.buyerPhone),
        buyerEmail: f.buyerEmail || null, toName: f.toName || null, toEmail: f.toEmail || null, message: f.message || null });
      break;
    } catch (e) { if (i === 2) throw e; code = voucherCode(); }
  }
  await notify("voucher_ordered", { enquiryName: f.buyerName, amount: f.amount });
  redirect(`/vouchers/${token}`);
}

export async function uploadVoucherSlip(_: VState, fd: FormData): Promise<VState> {
  const token = String(fd.get("token"));
  const [v] = await db.select().from(schema.vouchers).where(eq(schema.vouchers.token, token));
  if (!v || v.status !== "PENDING") return { error: "This voucher isn't waiting for payment." };
  try {
    const slip = await saveImage(fd.get("slip") as File | null, "slips", 1400);
    if (!slip) return { error: "Choose a photo or screenshot of the slip." };
    await db.update(schema.vouchers).set({ slip }).where(eq(schema.vouchers.id, v.id));
  } catch (e) { return { error: (e as Error).message }; }
  await notify("voucher_ordered", { enquiryName: `${v.buyerName} (slip uploaded)`, amount: v.amount });
  revalidatePath(`/vouchers/${token}`);
  return { ok: true };
}
