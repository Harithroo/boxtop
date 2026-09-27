import type { BankAccount } from "@/lib/settings";
import { rs } from "@/lib/format";

export function BankDetails({ accounts, amount, reference }: { accounts: BankAccount[]; amount: number; reference: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm">Amount <b>{rs(amount)}</b> · Reference <b>{reference}</b></p>
      <div className={`grid gap-2 ${accounts.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {accounts.map((a, i) => (
          <dl key={i} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-md bg-surface-alt p-3 text-sm">
            <dt className="text-ink-muted">Bank</dt><dd className="font-bold">{a.bankName}{a.branch && `, ${a.branch}`}</dd>
            {a.accountName && <><dt className="text-ink-muted">Name</dt><dd>{a.accountName}</dd></>}
            <dt className="text-ink-muted">Account</dt><dd className="font-bold tracking-wide">{a.accountNumber}</dd>
          </dl>
        ))}
      </div>
      {accounts.length > 1 && <p className="hint">Pay into any one of these accounts.</p>}
    </div>
  );
}
