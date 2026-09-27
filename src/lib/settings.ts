import { eq } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";

export const CHANNELS = ["email", "sms", "push", "whatsapp"] as const;
export type Channel = (typeof CHANNELS)[number];

export const EVENTS = {
  order_placed: "Order placed",
  slip_uploaded: "Bank slip uploaded",
  order_confirmed: "Order confirmed",
  order_packed: "Order packed",
  order_dispatched: "Order dispatched",
  order_delivered: "Order delivered",
  order_cancelled: "Order cancelled",
  enquiry_received: "Custom order or contact enquiry",
  quote_requested: "Corporate quote requested",
  quote_sent: "Quote sent to customer",
  quote_accepted: "Quote accepted",
  voucher_ordered: "Gift voucher ordered",
  voucher_issued: "Gift voucher issued",
  review_submitted: "New review to approve",
  reminder: "Occasion reminder",
} as const;
export type NotifyEvent = keyof typeof EVENTS;

export type BankAccount = { bankName: string; branch: string; accountName: string; accountNumber: string };

export type Settings = {
  store: {
    name: string; phone: string; whatsapp: string; email: string; address: string; hours: string;
    announcement: string; instagram: string; facebook: string; tiktok: string;
  };
  payments: {
    cod: { enabled: boolean; maxOrder: number };
    bank: { enabled: boolean; accounts: BankAccount[]; instructions: string };
  };
  delivery: { sameDayEnabled: boolean; maxDaysAhead: number };
  notifications: {
    ownerEmail: string; ownerPhone: string;
    events: Record<NotifyEvent, { owner: Channel[]; customer: Channel[] }>;
    templates: Partial<Record<NotifyEvent, string>>;
    email: { host: string; port: number; user: string; pass: string; from: string };
    sms: { provider: "notify.lk" | "text.lk" | "none"; userId: string; apiKey: string; senderId: string };
    push: { publicKey: string; privateKey: string };
    whatsapp: { cloudApiToken: string; phoneNumberId: string };
  };
};

const noChannels = { owner: [] as Channel[], customer: [] as Channel[] };

export const DEFAULT_SETTINGS: Settings = {
  store: {
    name: "Boxtop", phone: "", whatsapp: "", email: "hello@box-top.lk", address: "Piliyandala, Sri Lanka",
    hours: "Every day, 8am to 8pm", announcement: "Order by 7am for same-day delivery in Colombo",
    instagram: "https://www.instagram.com/box.top_/", facebook: "", tiktok: "https://www.tiktok.com/@boxtop_",
  },
  payments: {
    cod: { enabled: true, maxOrder: 25000 },
    bank: { enabled: true, accounts: [], instructions: "Transfer the total to any one of these accounts and upload the slip. We confirm your order once it clears." },
  },
  delivery: { sameDayEnabled: true, maxDaysAhead: 30 },
  notifications: {
    ownerEmail: "", ownerPhone: "",
    events: {
      order_placed: { owner: ["email", "push"], customer: ["email"] },
      slip_uploaded: { owner: ["email", "push"], customer: [] },
      order_confirmed: { owner: [], customer: ["email"] },
      order_packed: noChannels,
      order_dispatched: { owner: [], customer: ["email"] },
      order_delivered: { owner: [], customer: ["email"] },
      order_cancelled: { owner: [], customer: ["email"] },
      enquiry_received: { owner: ["email", "push"], customer: [] },
      quote_requested: { owner: ["email", "push"], customer: [] },
      quote_sent: { owner: [], customer: ["email"] },
      quote_accepted: { owner: ["email", "push"], customer: [] },
      voucher_ordered: { owner: ["email", "push"], customer: [] },
      voucher_issued: { owner: [], customer: ["email"] },
      review_submitted: { owner: ["push"], customer: [] },
      reminder: { owner: [], customer: ["email"] },
    },
    templates: {},
    email: { host: "", port: 465, user: "", pass: "", from: "Boxtop <hello@box-top.lk>" },
    sms: { provider: "none", userId: "", apiKey: "", senderId: "" },
    push: { publicKey: "", privateKey: "" },
    whatsapp: { cloudApiToken: "", phoneNumberId: "" },
  },
};

type Key = keyof Settings;

function merge<T>(base: T, over: unknown): T {
  if (over === null || typeof over !== "object" || Array.isArray(over) || typeof base !== "object" || base === null || Array.isArray(base)) {
    return (over === undefined ? base : (over as T));
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) out[k] = merge((base as Record<string, unknown>)[k], v);
  return out as T;
}

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.select().from(schema.settings);
  const s = structuredClone(DEFAULT_SETTINGS);
  for (const r of rows) {
    if (r.key in s) (s as Record<string, unknown>)[r.key] = merge(s[r.key as Key], r.value);
  }
  // older single-account shape -> accounts list
  const b = s.payments.bank as Settings["payments"]["bank"] & Partial<BankAccount>;
  if (!Array.isArray(b.accounts)) b.accounts = [];
  if (b.accountNumber && !b.accounts.length) b.accounts.push({ bankName: b.bankName ?? "", branch: b.branch ?? "", accountName: b.accountName ?? "", accountNumber: b.accountNumber });
  delete b.bankName; delete b.branch; delete b.accountName; delete b.accountNumber;
  // events added later default on
  for (const k of Object.keys(DEFAULT_SETTINGS.notifications.events) as NotifyEvent[]) s.notifications.events[k] ??= DEFAULT_SETTINGS.notifications.events[k];
  return s;
});

export async function saveSetting<K extends Key>(key: K, value: Settings[K]) {
  const existing = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
  if (existing.length) await db.update(schema.settings).set({ value }).where(eq(schema.settings.key, key));
  else await db.insert(schema.settings).values({ key, value });
}
