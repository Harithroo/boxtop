"use server";
import { z } from "zod";
import { db, schema } from "@/db";
import { saveImage } from "@/lib/uploads";
import { notify } from "@/lib/notify";
import { isLkMobile, lkPhone } from "@/lib/format";

export type EnquiryState = { ok?: boolean; error?: string };

const E = z.object({
  kind: z.enum(["CUSTOM", "CORPORATE", "CONTACT"]),
  name: z.string().trim().min(2, "Enter your name"),
  phone: z.string().trim().refine(isLkMobile, "Enter a Sri Lankan mobile number"),
  email: z.string().trim().email().or(z.literal("")).optional(),
  company: z.string().trim().max(160).optional(),
  occasion: z.string().trim().max(80).optional(),
  budget: z.string().trim().max(40).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional(),
  quantity: z.coerce.number().int().min(0).max(100000).optional(),
  message: z.string().trim().min(5, "Tell us a little more").max(3000),
  website: z.string().max(0).optional(), // honeypot
});

export async function submitEnquiry(_: EnquiryState, fd: FormData): Promise<EnquiryState> {
  const p = E.safeParse(Object.fromEntries(fd.entries()));
  if (!p.success) return { error: p.error.issues[0].message };
  const f = p.data;
  try {
    const photo = await saveImage(fd.get("photo") as File | null, "enquiries", 1400);
    await db.insert(schema.enquiries).values({
      kind: f.kind, name: f.name, phone: lkPhone(f.phone), email: f.email || null, company: f.company || null,
      occasion: f.occasion || null, budget: f.budget || null, date: f.date || null, quantity: f.quantity || null, message: f.message, photo,
    });
    await notify("enquiry_received", { enquiryKind: f.kind.toLowerCase(), enquiryName: f.name, customerPhone: f.phone });
  } catch (e) {
    return { error: (e as Error).message };
  }
  return { ok: true };
}
