// Once-a-day jobs, triggered by the every-minute cron (runs the first time after 08:00 Colombo time each day).
import { and, eq, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { colomboNow, addDays } from "./delivery";
import { messageFor } from "./notify";
import { getSettings } from "./settings";

export async function runDaily() {
  const now = colomboNow();
  if (now.time < "08:00") return { skipped: "before 08:00" };
  const [mark] = await db.select().from(schema.settings).where(eq(schema.settings.key, "daily_ran"));
  if ((mark?.value as string | undefined) === now.date) return { skipped: "already ran today" };
  if (mark) await db.update(schema.settings).set({ value: now.date }).where(eq(schema.settings.key, "daily_ran"));
  else await db.insert(schema.settings).values({ key: "daily_ran", value: now.date });

  // 1. Occasion reminders: queue those whose day is exactly daysBefore away
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://box-top.lk";
  const year = Number(now.date.slice(0, 4));
  const rows = await db.select({ r: schema.reminders, c: schema.customers }).from(schema.reminders).innerJoin(schema.customers, eq(schema.customers.id, schema.reminders.customerId));
  let reminders = 0;
  for (const { r, c } of rows) {
    let target = `${year}-${String(r.month).padStart(2, "0")}-${String(r.day).padStart(2, "0")}`;
    if (target < now.date) target = `${year + 1}${target.slice(4)}`;
    if (addDays(now.date, r.daysBefore) !== target || r.lastSentYear === Number(target.slice(0, 4))) continue;
    // the customer chose the channel for this reminder, so queue it directly (the reminder switch still applies)
    const settings = await getSettings();
    if (settings.notifications.events.reminder.customer.length) {
      const to = r.channel === "EMAIL" ? c.email : c.phone;
      if (to) await db.insert(schema.notificationJobs).values({
        channel: r.channel, to, event: "reminder", subject: `Reminder: ${r.name}'s ${r.occasion.toLowerCase()}`,
        body: messageFor("reminder", "customer", { customerName: c.name.split(" ")[0], text: `${r.name}'s ${r.occasion.toLowerCase()} is on ${target.slice(8)}/${target.slice(5, 7)}.`, link: `${site}/shop` }, settings),
      });
    }
    await db.update(schema.reminders).set({ lastSentYear: Number(target.slice(0, 4)) }).where(eq(schema.reminders.id, r.id));
    reminders++;
  }

  // 2. Expire sent quotes past their date
  await db.update(schema.quotes).set({ status: "EXPIRED" }).where(and(eq(schema.quotes.status, "SENT"), lt(schema.quotes.expiresAt, now.date)));

  // 3. Tidy old sign-in codes
  await db.delete(schema.otpCodes).where(lt(schema.otpCodes.expiresAt, new Date(Date.now() - 86400000)));
  return { reminders };
}
