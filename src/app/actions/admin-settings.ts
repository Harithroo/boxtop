"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import webpush from "web-push";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings, saveSetting, CHANNELS, EVENTS, type Channel, type NotifyEvent } from "@/lib/settings";
import { sendNow } from "@/lib/notify";
import { newTotpSecret, verifyTotp } from "@/lib/totp";

export type SState = { ok?: number; error?: string; info?: string };
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => Number(fd.get(k) ?? 0) || 0;
const on = (fd: FormData, k: string) => fd.get(k) === "on";

export async function saveStore(_: SState, fd: FormData): Promise<SState> {
  await requireAdmin();
  const s = await getSettings();
  await saveSetting("store", { ...s.store, name: str(fd, "name") || "Boxtop", phone: str(fd, "phone"), whatsapp: str(fd, "whatsapp"), email: str(fd, "email"),
    address: str(fd, "address"), hours: str(fd, "hours"), announcement: str(fd, "announcement"), facebook: str(fd, "facebook"), instagram: str(fd, "instagram"), tiktok: str(fd, "tiktok") });
  await saveSetting("delivery", { sameDayEnabled: on(fd, "sameDayEnabled"), maxDaysAhead: Math.max(1, num(fd, "maxDaysAhead") || 30) });
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

/** Repeated inputs bankName/branch/accountName/accountNumber, one set per account. */
function bankAccounts(fd: FormData) {
  const col = (k: string) => fd.getAll(k).map((v) => String(v).trim());
  const [names, branches, holders, numbers] = [col("bankName"), col("branch"), col("accountName"), col("accountNumber")];
  return numbers.map((n, i) => ({ bankName: names[i] ?? "", branch: branches[i] ?? "", accountName: holders[i] ?? "", accountNumber: n })).filter((a) => a.accountNumber);
}

export async function savePayments(_: SState, fd: FormData): Promise<SState> {
  await requireAdmin();
  if (!on(fd, "cod") && !on(fd, "bank")) return { error: "Keep at least one payment method on." };
  if (on(fd, "bank") && !bankAccounts(fd).length) return { error: "Add at least one bank account, or switch bank transfer off." };
  await saveSetting("payments", {
    cod: { enabled: on(fd, "cod"), maxOrder: num(fd, "codMax") },
    bank: { enabled: on(fd, "bank"), accounts: bankAccounts(fd), instructions: str(fd, "instructions") },
  });
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

export async function saveNotifications(_: SState, fd: FormData): Promise<SState> {
  await requireAdmin();
  const s = await getSettings();
  const n = structuredClone(s.notifications);
  n.ownerEmail = str(fd, "ownerEmail"); n.ownerPhone = str(fd, "ownerPhone");
  for (const ev of Object.keys(EVENTS) as NotifyEvent[]) {
    n.events[ev] = {
      owner: CHANNELS.filter((c) => on(fd, `${ev}.owner.${c}`)) as Channel[],
      customer: CHANNELS.filter((c) => on(fd, `${ev}.customer.${c}`)) as Channel[],
    };
    const t = str(fd, `tpl.${ev}`);
    if (t) n.templates[ev] = t; else delete n.templates[ev];
  }
  const keep = (k: string, old: string) => (str(fd, k) === "••••••" ? old : str(fd, k));
  n.email = { host: str(fd, "smtpHost"), port: num(fd, "smtpPort") || 465, user: str(fd, "smtpUser"), pass: keep("smtpPass", s.notifications.email.pass), from: str(fd, "smtpFrom") };
  n.sms = { provider: (str(fd, "smsProvider") || "none") as "none", userId: str(fd, "smsUserId"), apiKey: keep("smsApiKey", s.notifications.sms.apiKey), senderId: str(fd, "smsSenderId") };
  await saveSetting("notifications", n);
  return { ok: Date.now() };
}

export async function generatePushKeys(): Promise<SState> {
  await requireAdmin();
  const s = await getSettings();
  const k = webpush.generateVAPIDKeys();
  await saveSetting("notifications", { ...s.notifications, push: { publicKey: k.publicKey, privateKey: k.privateKey } });
  revalidatePath("/admin/settings/notifications");
  return { ok: Date.now(), info: "Push keys created. Now tap “Turn on alerts on this device”." };
}

export async function testSend(_: SState, fd: FormData): Promise<SState> {
  await requireAdmin();
  const ch = str(fd, "channel").toUpperCase();
  const s = await getSettings();
  const to = ch === "EMAIL" ? s.notifications.ownerEmail : ch === "PUSH" ? "owner" : s.notifications.ownerPhone;
  if (!to) return { error: "Save the owner email / phone first." };
  try {
    await sendNow(ch, to, "Boxtop test", "This is a test message from your Boxtop back office.");
    return { ok: Date.now(), info: `Test ${ch.toLowerCase()} sent.` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function changePassword(_: SState, fd: FormData): Promise<SState> {
  const sess = await requireAdmin();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, sess.uid));
  if (!u || !(await bcrypt.compare(str(fd, "current"), u.passwordHash))) return { error: "Current password is wrong." };
  const next = str(fd, "next");
  if (next.length < 10) return { error: "Use at least 10 characters." };
  await db.update(schema.users).set({ passwordHash: await bcrypt.hash(next, 12) }).where(eq(schema.users.id, u.id));
  return { ok: Date.now(), info: "Password changed." };
}

export async function startTotp(): Promise<SState> {
  const sess = await requireAdmin();
  await db.update(schema.users).set({ totpSecret: newTotpSecret(), totpEnabled: false }).where(eq(schema.users.id, sess.uid));
  revalidatePath("/admin/settings");
  return { ok: Date.now() };
}

export async function confirmTotp(_: SState, fd: FormData): Promise<SState> {
  const sess = await requireAdmin();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, sess.uid));
  if (!u?.totpSecret || !verifyTotp(u.totpSecret, str(fd, "code"))) return { error: "That code didn't match." };
  await db.update(schema.users).set({ totpEnabled: true }).where(eq(schema.users.id, u.id));
  revalidatePath("/admin/settings");
  return { ok: Date.now(), info: "Two-step sign-in is on." };
}

export async function disableTotp(): Promise<SState> {
  const sess = await requireAdmin();
  await db.update(schema.users).set({ totpEnabled: false, totpSecret: null }).where(eq(schema.users.id, sess.uid));
  revalidatePath("/admin/settings");
  return { ok: Date.now() };
}

export async function setEnquiryStatus(fd: FormData) {
  await requireAdmin();
  await db.update(schema.enquiries).set({ status: str(fd, "status") }).where(eq(schema.enquiries.id, num(fd, "id")));
  revalidatePath("/admin/enquiries");
}
