import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { and, desc, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, schema } from "@/db";
import { sendNow } from "./notify";
import { isLkMobile, lkPhone } from "./format";
import { throttle } from "./auth";

const COOKIE = "bt_cust";
const key = () => new TextEncoder().encode((process.env.SESSION_SECRET ?? "") + ":customer");

/** "user@x.lk" stays an email; "077 123 4567" becomes 94771234567. */
export function normaliseTarget(input: string) {
  const t = input.trim().toLowerCase();
  if (t.includes("@")) return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t) ? { kind: "email" as const, value: t } : null;
  return isLkMobile(t) ? { kind: "phone" as const, value: lkPhone(t) } : null;
}

export async function requestOtp(input: string, ip: string) {
  const t = normaliseTarget(input);
  if (!t) return { error: "Enter your email or a Sri Lankan mobile number." };
  if (!throttle(`otp|${ip}|${t.value}`)) return { error: "Too many codes requested. Try again in 15 minutes." };
  const code = String(crypto.randomInt(100000, 1000000));
  await db.insert(schema.otpCodes).values({ target: t.value, codeHash: await bcrypt.hash(code, 8), expiresAt: new Date(Date.now() + 10 * 60_000) });
  try {
    await sendNow(t.kind === "email" ? "EMAIL" : "SMS", t.value, "Your Boxtop sign-in code", `Your Boxtop sign-in code is ${code}. It expires in 10 minutes.`);
  } catch {
    // local development without SMTP/SMS set up: print the code in the terminal instead
    if (process.env.NODE_ENV !== "production") { console.log(`[dev] sign-in code for ${t.value}: ${code}`); return { target: t.value }; }
    return { error: t.kind === "email" ? "We couldn't send an email right now. Try your mobile number instead." : "We couldn't send an SMS right now. Try your email instead." };
  }
  return { target: t.value };
}

export async function verifyOtp(target: string, code: string) {
  const [row] = await db.select().from(schema.otpCodes)
    .where(and(eq(schema.otpCodes.target, target), gt(schema.otpCodes.expiresAt, new Date()))).orderBy(desc(schema.otpCodes.id)).limit(1);
  if (!row || row.attempts >= 5) return false;
  await db.update(schema.otpCodes).set({ attempts: row.attempts + 1 }).where(eq(schema.otpCodes.id, row.id));
  if (!(await bcrypt.compare(code, row.codeHash))) return false;
  await db.delete(schema.otpCodes).where(eq(schema.otpCodes.target, target));
  return true;
}

export async function findCustomer(target: string) {
  const col = target.includes("@") ? schema.customers.email : schema.customers.phone;
  const [c] = await db.select().from(schema.customers).where(eq(col, target)).limit(1);
  return c ?? null;
}

export async function setCustomerSession(payload: { cid?: number; pending?: string; via?: string }) {
  const token = await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime(payload.cid ? "60d" : "20m").sign(key());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: payload.cid ? 60 * 86400 : 1200 });
}

export async function readCustomerSession(): Promise<{ cid?: number; pending?: string; via?: string } | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  try { const { payload } = await jwtVerify(t, key()); return { cid: payload.cid as number | undefined, pending: payload.pending as string | undefined, via: payload.via as string | undefined }; } catch { return null; }
}

export async function currentCustomer() {
  const s = await readCustomerSession();
  if (!s?.cid) return null;
  const [c] = await db.select().from(schema.customers).where(eq(schema.customers.id, s.cid));
  return c ? { ...c, via: s.via ?? c.phone } : null;
}

export async function signOutCustomer() { (await cookies()).delete(COOKIE); }
