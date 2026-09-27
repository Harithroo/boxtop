import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSettings } from "@/lib/settings";
import { rs, prettyDate } from "@/lib/format";
import { BankDetails } from "@/components/BankDetails";
import { VoucherSlipForm } from "@/components/VoucherForms";

export const metadata = { title: "Your gift voucher", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function VoucherPage({ params }: { params: Promise<{ token: string }> }) {
  const [v] = await db.select().from(schema.vouchers).where(eq(schema.vouchers.token, (await params).token));
  if (!v) notFound();
  const s = await getSettings();
  return (
    <div className="container-bt max-w-2xl py-8">
      <p className="eyebrow">Gift voucher</p>
      <h1 className="h1">{rs(v.amount)} Boxtop voucher</h1>
      {v.toName && <p className="mt-1 text-ink-muted">For {v.toName}</p>}
      {v.status === "PENDING" && (
        <section className="card mt-6 space-y-4 p-5">
          <h2 className="h2">Pay by bank transfer</h2>
          <p className="text-sm">{s.payments.bank.instructions}</p>
          <BankDetails accounts={s.payments.bank.accounts} amount={v.amount} reference={v.code.slice(3)} />
          {v.slip ? <p className="rounded-md bg-brand-soft p-3 text-sm">Slip received. We&apos;ll email the voucher code once payment is confirmed.</p> : <VoucherSlipForm token={v.token} />}
        </section>
      )}
      {(v.status === "ACTIVE" || v.status === "USED") && (
        <div className="ribbon-frame mt-6 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent-soft">Code</p>
          <p className="mt-1 font-mono text-2xl tracking-widest">{v.code}</p>
          <p className="mt-4">Balance <b>{rs(v.balance)}</b> of {rs(v.amount)}{v.expiresAt && <> · valid until {prettyDate(v.expiresAt)} {v.expiresAt.slice(0, 4)}</>}</p>
          {v.message && <p className="mt-4 italic opacity-90">&ldquo;{v.message}&rdquo; · {v.buyerName}</p>}
          <p className="mt-4 text-sm opacity-80">Enter the code at checkout on box-top.lk.</p>
        </div>
      )}
      {v.status === "CANCELLED" && <p className="mt-6 text-ink-muted">This voucher was cancelled.</p>}
    </div>
  );
}
