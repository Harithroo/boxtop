"use client";
import { useState } from "react";
import type { BankAccount } from "@/lib/settings";

const empty: BankAccount = { bankName: "", branch: "", accountName: "", accountNumber: "" };

/** Any number of bank accounts; customers see all of them and can pay into any one. */
export function BankAccountsEditor({ initial }: { initial: BankAccount[] }) {
  const [rows, setRows] = useState<(BankAccount & { key: number })[]>((initial.length ? initial : [empty]).map((a, i) => ({ ...a, key: i })));
  const set = (i: number, k: keyof BankAccount, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const move = (i: number, d: number) => { const r = [...rows]; [r[i], r[i + d]] = [r[i + d], r[i]]; setRows(r); };
  return (
    <div className="space-y-3">
      <p className="label mb-0">Bank accounts <span className="font-normal text-ink-muted">(shown in this order)</span></p>
      {rows.map((r, i) => (
        <fieldset key={r.key} className="rounded-md border border-line p-3">
          <legend className="px-1 text-xs font-bold text-ink-muted">Account {i + 1}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <input name="bankName" value={r.bankName} onChange={(e) => set(i, "bankName", e.target.value)} placeholder="Bank (e.g. Commercial Bank)" className="input" aria-label="Bank" />
            <input name="branch" value={r.branch} onChange={(e) => set(i, "branch", e.target.value)} placeholder="Branch" className="input" aria-label="Branch" />
            <input name="accountName" value={r.accountName} onChange={(e) => set(i, "accountName", e.target.value)} placeholder="Account name" className="input" aria-label="Account name" />
            <input name="accountNumber" value={r.accountNumber} onChange={(e) => set(i, "accountNumber", e.target.value)} placeholder="Account number" className="input" aria-label="Account number" />
          </div>
          <div className="mt-2 flex gap-3 text-xs">
            {i > 0 && <button type="button" className="text-brand" onClick={() => move(i, -1)}>Move up</button>}
            {i < rows.length - 1 && <button type="button" className="text-brand" onClick={() => move(i, 1)}>Move down</button>}
            {rows.length > 1 && <button type="button" className="text-accent-text" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>}
          </div>
        </fieldset>
      ))}
      <button type="button" className="text-sm font-bold text-brand" onClick={() => setRows([...rows, { ...empty, key: Date.now() }])}>+ Add another account</button>
    </div>
  );
}
