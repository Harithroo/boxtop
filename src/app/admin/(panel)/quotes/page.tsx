import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { newQuote } from "@/app/actions/admin-extra";
import { prettyDate } from "@/lib/format";
export const dynamic = "force-dynamic";
const LABEL = { REQUESTED: "New request", SENT: "Sent", ACCEPTED: "Accepted", DECLINED: "Declined", EXPIRED: "Expired" } as const;
export default async function Quotes() {
  await requireAdmin();
  const rows = await db.select().from(schema.quotes).orderBy(desc(schema.quotes.id)).limit(200);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2"><h1 className="h1 mr-auto">Corporate quotes</h1></div>
      <div className="overflow-x-auto rounded-lg bg-surface shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface-alt"><tr>{["Quote", "Company / contact", "Boxes", "Needed by", "Status"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((q) => (
              <tr key={q.id}>
                <td className="p-3"><Link href={`/admin/quotes/${q.id}`} className="font-bold text-brand">{q.number}</Link></td>
                <td className="p-3">{q.company ?? "–"}<span className="hint block">{q.contactName}</span></td>
                <td className="p-3">{q.quantity ?? "–"}</td>
                <td className="p-3">{q.neededBy ? prettyDate(q.neededBy) : "–"}</td>
                <td className="p-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${q.status === "REQUESTED" ? "bg-accent-soft text-accent-text" : q.status === "ACCEPTED" ? "bg-[#E3F2EA] text-success" : "bg-brand-soft text-brand"}`}>{LABEL[q.status]}</span></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="p-6 text-center text-ink-muted">No quote requests yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <details className="card p-4">
        <summary className="cursor-pointer font-bold">Start a quote yourself (e.g. from a phone call)</summary>
        <form action={newQuote} className="mt-3 grid gap-2 sm:grid-cols-4">
          <input name="contactName" className="input" placeholder="Contact name" required aria-label="Contact name" />
          <input name="company" className="input" placeholder="Company" aria-label="Company" />
          <input name="phone" className="input" placeholder="Mobile" required aria-label="Mobile" />
          <input name="email" type="email" className="input" placeholder="Email" aria-label="Email" />
          <button className="btn-primary btn-sm sm:col-span-4 sm:w-fit">Create quote</button>
        </form>
      </details>
    </div>
  );
}
