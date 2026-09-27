import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentCustomer } from "@/lib/customer-auth";
import { deleteReminder } from "@/app/actions/account";
import { ReminderForm } from "@/components/ReminderForm";

export const metadata = { title: "Gift reminders", robots: { index: false } };
export const dynamic = "force-dynamic";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function Reminders() {
  const c = await currentCustomer();
  if (!c) redirect("/account");
  const rows = await db.select().from(schema.reminders).where(eq(schema.reminders.customerId, c.id)).orderBy(asc(schema.reminders.month), asc(schema.reminders.day));
  return (
    <div className="container-bt max-w-3xl py-8">
      <Link href="/account" className="text-sm text-brand">← Account</Link>
      <h1 className="h1 mt-1">Gift reminders</h1>
      <p className="mb-6 mt-1 text-ink-muted">Save birthdays and anniversaries. We&apos;ll remind you before the day, every year.</p>
      <ReminderForm hasEmail={!!c.email} />
      <ul className="mt-6 divide-y divide-line rounded-lg bg-surface">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 p-4 text-sm">
            <span className="w-14 text-center"><b className="block text-lg">{r.day}</b>{MONTHS[r.month - 1]}</span>
            <span className="flex-1"><b>{r.name}</b> · {r.occasion}<span className="hint block">{r.daysBefore} days before, by {r.channel === "SMS" ? "SMS" : "email"}</span></span>
            <form action={deleteReminder}><input type="hidden" name="id" value={r.id} /><button className="text-xs text-accent-text">Delete</button></form>
          </li>
        ))}
        {!rows.length && <li className="p-4 text-sm text-ink-muted">No reminders yet.</li>}
      </ul>
    </div>
  );
}
