"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requestOtp, verifyOtp, findCustomer, setCustomerSession, readCustomerSession, currentCustomer, signOutCustomer, normaliseTarget } from "@/lib/customer-auth";

export type AState = { error?: string; step?: "code" | "profile"; target?: string };

export async function sendCode(_: AState, fd: FormData): Promise<AState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "local";
  const r = await requestOtp(String(fd.get("target") ?? ""), ip);
  if ("error" in r) return { error: r.error };
  return { step: "code", target: r.target };
}

export async function checkCode(_: AState, fd: FormData): Promise<AState> {
  const target = String(fd.get("target"));
  if (!(await verifyOtp(target, String(fd.get("code") ?? "").trim()))) return { step: "code", target, error: "That code didn't match or has expired." };
  const c = await findCustomer(target);
  if (c) { await setCustomerSession({ cid: c.id, via: target }); redirect("/account"); }
  await setCustomerSession({ pending: target });
  return { step: "profile", target };
}

/** First sign-in with no past orders: collect name and the other contact detail. */
export async function completeProfile(_: AState, fd: FormData): Promise<AState> {
  const s = await readCustomerSession();
  if (!s?.pending) return { error: "Your sign-in expired. Please start again." };
  const name = String(fd.get("name") ?? "").trim();
  const phone = normaliseTarget(String(fd.get("phone") ?? ""));
  const email = String(fd.get("email") ?? "").trim().toLowerCase() || null;
  if (name.length < 2) return { step: "profile", target: s.pending, error: "Enter your name." };
  const phoneValue = s.pending.includes("@") ? (phone?.kind === "phone" ? phone.value : null) : s.pending;
  if (!phoneValue) return { step: "profile", target: s.pending, error: "Enter your mobile number." };
  const emailValue = s.pending.includes("@") ? s.pending : email;
  const [existing] = await db.select().from(schema.customers).where(eq(schema.customers.phone, phoneValue));
  let cid: number;
  if (existing) {
    // Don't let an email sign-in take over someone else's phone record
    if (s.pending.includes("@")) return { step: "profile", target: s.pending, error: "That mobile number already has an account. Sign in with the mobile number instead." };
    cid = existing.id;
  } else cid = (await db.insert(schema.customers).values({ name, phone: phoneValue, email: emailValue }).$returningId())[0].id;
  await setCustomerSession({ cid, via: s.pending });
  redirect("/account");
}

export async function signOut() { await signOutCustomer(); redirect("/account"); }

export async function saveReminder(_: { error?: string; ok?: number }, fd: FormData): Promise<{ error?: string; ok?: number }> {
  const c = await currentCustomer();
  if (!c) return { error: "Please sign in again." };
  const name = String(fd.get("name") ?? "").trim();
  const occasion = String(fd.get("occasion") ?? "").trim() || "Birthday";
  const [m, d] = String(fd.get("date") ?? "").split("-").slice(1).map(Number);
  if (!name || !m || !d) return { error: "Add whose day it is and the date." };
  const channel = fd.get("channel") === "SMS" ? "SMS" : "EMAIL";
  if (channel === "EMAIL" && !c.email) return { error: "Add an email to your account first, or choose SMS." };
  await db.insert(schema.reminders).values({ customerId: c.id, name: name.slice(0, 120), occasion: occasion.slice(0, 80), month: m, day: d, channel, daysBefore: Math.min(30, Math.max(1, Number(fd.get("daysBefore")) || 7)) });
  revalidatePath("/account/reminders");
  return { ok: Date.now() };
}

export async function deleteReminder(fd: FormData) {
  const c = await currentCustomer();
  if (!c) return;
  await db.delete(schema.reminders).where(and(eq(schema.reminders.id, Number(fd.get("id"))), eq(schema.reminders.customerId, c.id)));
  revalidatePath("/account/reminders");
}

export async function updateEmail(fd: FormData) {
  const c = await currentCustomer();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (c && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) await db.update(schema.customers).set({ email }).where(eq(schema.customers.id, c.id));
  revalidatePath("/account");
}
