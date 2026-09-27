import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { voucherAction, createVoucher } from "@/app/actions/admin-extra";
import { rs } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function Vouchers() {
  await requireAdmin();
  const rows = await db.select().from(schema.vouchers).orderBy(desc(schema.vouchers.id)).limit(300);
  return (
    <div className="space-y-4">
      <h1 className="h1">Gift vouchers</h1>
      <p className="hint">Vouchers bought on the site wait here until you check the slip and activate them. Activating emails the code.</p>
      <div className="overflow-x-auto rounded-lg bg-surface shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-alt"><tr>{["Code", "Bought by → for", "Value / balance", "Status", ""].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((v) => (
              <tr key={v.id}>
                <td className="p-3 font-mono">{v.code}</td>
                <td className="p-3">{v.buyerName} <span className="hint">+{v.buyerPhone}</span>{v.toName && <> → {v.toName}</>}</td>
                <td className="p-3">{rs(v.amount)} / <b>{rs(v.balance)}</b></td>
                <td className="p-3">{v.status.toLowerCase()}{v.expiresAt && <span className="hint block">until {v.expiresAt}</span>}</td>
                <td className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {v.slip && <a href={v.slip} target="_blank" className="text-brand">Slip</a>}
                    {v.status === "PENDING" && <form action={voucherAction}><input type="hidden" name="id" value={v.id} /><button name="op" value="activate" className="btn-primary btn-sm">Paid: activate</button></form>}
                    {(v.status === "PENDING" || v.status === "ACTIVE") && <form action={voucherAction}><input type="hidden" name="id" value={v.id} /><button name="op" value="cancel" className="text-xs text-accent-text">Cancel</button></form>}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="p-6 text-center text-ink-muted">No vouchers yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <details className="card p-4">
        <summary className="cursor-pointer font-bold">Create a voucher (sold in chat, or a gift from Boxtop)</summary>
        <form action={createVoucher} className="mt-3 grid gap-2 sm:grid-cols-3">
          <input name="amount" type="number" min={100} className="input" placeholder="Amount (Rs.)" required aria-label="Amount" />
          <input name="buyerName" className="input" placeholder="Bought by" aria-label="Bought by" />
          <input name="buyerPhone" className="input" placeholder="Their mobile" aria-label="Buyer mobile" />
          <input name="buyerEmail" type="email" className="input" placeholder="Their email" aria-label="Buyer email" />
          <input name="toName" className="input" placeholder="For (name)" aria-label="Recipient name" />
          <input name="toEmail" type="email" className="input" placeholder="Recipient email (gets the code)" aria-label="Recipient email" />
          <input name="message" className="input sm:col-span-2" placeholder="Message" aria-label="Message" />
          <select name="paymentMethod" className="input" aria-label="Payment"><option value="BANK_TRANSFER">Bank transfer</option><option value="CASH">Cash</option><option value="FREE">Free (gift or goodwill)</option></select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="activate" defaultChecked /> Activate and email now</label>
          <button className="btn-primary btn-sm sm:w-fit">Create voucher</button>
        </form>
      </details>
    </div>
  );
}
