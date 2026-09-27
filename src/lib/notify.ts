// Notification service: events -> queued jobs per channel -> sent by the cron worker.
// Checkout never waits on email/SMS; failures retry and are logged in the admin.
import { and, eq, lte, asc } from "drizzle-orm";
import nodemailer from "nodemailer";
import webpush from "web-push";
import { db, schema } from "@/db";
import { EVENTS, getSettings, type Channel, type NotifyEvent, type Settings } from "./settings";
import { lkPhone, rs } from "./format";

export type NotifyContext = {
  orderId?: number;
  number?: string;
  total?: number;
  customerName?: string;
  customerEmail?: string | null;
  customerPhone?: string;
  deliveryDate?: string;
  slot?: string;
  status?: string;
  trackUrl?: string;
  enquiryKind?: string;
  enquiryName?: string;
  reviewUrl?: string;
  link?: string; // quote, voucher or other page for this message
  code?: string; // voucher code
  amount?: number;
  text?: string; // free text, e.g. reminder details
  optIns?: string[] | null; // customer's chosen channels; null = all switched on
};

const DEFAULT_TEMPLATES: Record<NotifyEvent, { customer: string; owner: string }> = {
  order_placed: {
    customer: "Hi {name}, thank you for your Boxtop order {number} ({total}). Delivery: {date}, {slot}. Track it: {track}",
    owner: "New order {number} from {name}: {total}, delivery {date} {slot}.",
  },
  slip_uploaded: { customer: "", owner: "Bank slip uploaded for {number} ({total}). Check and confirm it." },
  order_confirmed: { customer: "Your Boxtop order {number} is confirmed. We will deliver on {date}, {slot}.", owner: "" },
  order_packed: { customer: "Your Boxtop order {number} is packed and ready.", owner: "" },
  order_dispatched: { customer: "Your Boxtop order {number} is on the way. Track it: {track}", owner: "" },
  order_delivered: { customer: "Your Boxtop order {number} has been delivered. Thank you for gifting with us! How did we do? {review}", owner: "" },
  order_cancelled: { customer: "Your Boxtop order {number} has been cancelled. Reply to us on WhatsApp if this is unexpected.", owner: "" },
  enquiry_received: { customer: "", owner: "New {kind} enquiry from {enquirer}. Open the back office to reply." },
  quote_requested: { customer: "", owner: "New corporate quote request {number} from {enquirer}." },
  quote_sent: { customer: "Hi {name}, your Boxtop quote {number} is ready: {total}. View and accept it here: {link}", owner: "" },
  quote_accepted: { customer: "", owner: "Quote {number} was accepted by {enquirer}. Order created." },
  voucher_ordered: { customer: "", owner: "Gift voucher ordered by {enquirer}: {amount}. Check the slip and activate it." },
  voucher_issued: { customer: "Your Boxtop gift voucher: code {code}, value {amount}. Use it at checkout on box-top.lk. {text}", owner: "" },
  review_submitted: { customer: "", owner: "New {kind}-star review from {enquirer}. Approve it in the back office." },
  reminder: { customer: "Hi {name}, a reminder from Boxtop: {text} Order a gift box in time: {link}", owner: "" },
};

function fill(t: string, c: NotifyContext) {
  return t
    .replaceAll("{name}", c.customerName ?? "")
    .replaceAll("{number}", c.number ?? "")
    .replaceAll("{total}", c.total != null ? rs(c.total) : "")
    .replaceAll("{date}", c.deliveryDate ?? "")
    .replaceAll("{slot}", c.slot ?? "")
    .replaceAll("{track}", c.trackUrl ?? "")
    .replaceAll("{status}", c.status ?? "")
    .replaceAll("{kind}", c.enquiryKind ?? "")
    .replaceAll("{enquirer}", c.enquiryName ?? "")
    .replaceAll("{review}", c.reviewUrl ?? "")
    .replaceAll("{link}", c.link ?? "")
    .replaceAll("{code}", c.code ?? "")
    .replaceAll("{amount}", c.amount != null ? rs(c.amount) : "")
    .replaceAll("{text}", c.text ?? "")
    .replace(/\s+$/, "");
}

export function messageFor(event: NotifyEvent, audience: "customer" | "owner", ctx: NotifyContext, s: Settings) {
  const custom = audience === "customer" ? s.notifications.templates[event] : undefined;
  return fill(custom || DEFAULT_TEMPLATES[event][audience], ctx);
}

/** Queue messages for an event according to the admin switches. Never throws. */
export async function notify(event: NotifyEvent, ctx: NotifyContext) {
  try {
    const s = await getSettings();
    const cfg = s.notifications.events[event];
    const jobs: (typeof schema.notificationJobs.$inferInsert)[] = [];
    const subject = `${EVENTS[event]}${ctx.number ? ` · ${ctx.number}` : ""}`;

    const add = (audience: "owner" | "customer", ch: Channel) => {
      const body = messageFor(event, audience, ctx, s);
      if (!body) return;
      let to = "";
      if (ch === "email") to = audience === "owner" ? s.notifications.ownerEmail : ctx.customerEmail ?? "";
      if (ch === "sms" || ch === "whatsapp") to = audience === "owner" ? s.notifications.ownerPhone : ctx.customerPhone ?? "";
      if (ch === "push") to = audience === "owner" ? "owner" : `order:${ctx.orderId ?? ""}`;
      if (!to) return;
      jobs.push({ channel: ch.toUpperCase() as "EMAIL", to, subject, body, event, orderId: ctx.orderId });
    };
    cfg.owner.forEach((ch) => add("owner", ch));
    // push is opted into separately on the order page; the others follow the checkout choices
    cfg.customer.filter((ch) => ch === "push" || !ctx.optIns || ctx.optIns.includes(ch)).forEach((ch) => add("customer", ch));
    if (jobs.length) await db.insert(schema.notificationJobs).values(jobs);
  } catch (e) {
    console.error("notify failed", e);
  }
}

// ---------- Senders ----------
async function sendEmail(s: Settings, to: string, subject: string, body: string) {
  const e = s.notifications.email;
  if (!e.host) throw new Error("SMTP is not set up");
  const t = nodemailer.createTransport({ host: e.host, port: e.port, secure: e.port === 465, auth: { user: e.user, pass: e.pass } });
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1C1433"><p><img src="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://box-top.lk"}/brand/logo-192.png" alt="Boxtop" width="72" height="72" style="border-radius:8px"></p><p>${body
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/(https?:\/\/\S+)/g, '<a href="$1" style="color:#3C2894">$1</a>')}</p><p style="color:#5E5775;font-size:13px">taste for gift · box-top.lk</p></div>`;
  await t.sendMail({ from: e.from, to, subject, text: body, html });
}

async function sendSms(s: Settings, to: string, body: string) {
  const c = s.notifications.sms;
  const phone = lkPhone(to);
  if (c.provider === "notify.lk") {
    const u = new URL("https://app.notify.lk/api/v1/send");
    u.search = new URLSearchParams({ user_id: c.userId, api_key: c.apiKey, sender_id: c.senderId || "NotifyDEMO", to: phone, message: body }).toString();
    const r = await fetch(u);
    const j = (await r.json().catch(() => ({}))) as { status?: string };
    if (!r.ok || j.status !== "success") throw new Error(`notify.lk: ${JSON.stringify(j).slice(0, 200)}`);
    return;
  }
  if (c.provider === "text.lk") {
    const r = await fetch("https://app.text.lk/api/v3/sms/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${c.apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ recipient: phone, sender_id: c.senderId, type: "plain", message: body }),
    });
    if (!r.ok) throw new Error(`text.lk: ${(await r.text()).slice(0, 200)}`);
    return;
  }
  throw new Error("SMS provider is not set up");
}

async function sendPush(s: Settings, to: string, title: string, body: string) {
  const p = s.notifications.push;
  if (!p.publicKey || !p.privateKey) throw new Error("Push keys are not set up");
  webpush.setVapidDetails("mailto:" + (s.store.email || "hello@box-top.lk"), p.publicKey, p.privateKey);
  const subs = to === "owner"
    ? await db.select().from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.audience, "OWNER"))
    : await db.select().from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.orderId, Number(to.split(":")[1])));
  if (!subs.length) return; // nobody subscribed: nothing to do
  for (const sub of subs) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } }, JSON.stringify({ title, body, url: to === "owner" ? "/admin/orders" : "/track" }));
    } catch (e: unknown) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, sub.id));
      else throw e;
    }
  }
}

export async function sendNow(channel: string, to: string, subject: string, body: string) {
  const s = await getSettings();
  if (channel === "EMAIL") return sendEmail(s, to, subject, body);
  if (channel === "SMS") return sendSms(s, to, body);
  if (channel === "PUSH") return sendPush(s, to, subject, body);
  if (channel === "WHATSAPP") throw new Error("Automatic WhatsApp needs the Cloud API (phase 2). Use the click-to-send button on the order.");
}

/** Drain the queue. Called by cron every minute. */
export async function runJobs(limit = 20) {
  const due = await db.select().from(schema.notificationJobs)
    .where(and(eq(schema.notificationJobs.status, "QUEUED"), lte(schema.notificationJobs.runAfter, new Date())))
    .orderBy(asc(schema.notificationJobs.id)).limit(limit);
  let sent = 0, failed = 0;
  for (const j of due) {
    try {
      await sendNow(j.channel, j.to, j.subject ?? "Boxtop", j.body);
      await db.update(schema.notificationJobs).set({ status: "SENT", sentAt: new Date(), attempts: j.attempts + 1, error: null }).where(eq(schema.notificationJobs.id, j.id));
      sent++;
    } catch (e) {
      const attempts = j.attempts + 1;
      const giveUp = attempts >= 5;
      await db.update(schema.notificationJobs).set({
        attempts, error: String((e as Error).message ?? e).slice(0, 1000),
        status: giveUp ? "FAILED" : "QUEUED",
        runAfter: new Date(Date.now() + attempts * attempts * 60_000),
      }).where(eq(schema.notificationJobs.id, j.id));
      failed++;
    }
  }
  return { processed: due.length, sent, failed };
}
