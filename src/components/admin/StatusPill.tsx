import { STATUS_LABEL } from "@/lib/format";

export function StatusPill({ s }: { s: string }) {
  const c = s === "PENDING" ? "bg-accent-soft text-accent-text" : s === "DELIVERED" ? "bg-[#E3F2EA] text-success" : s === "CANCELLED" || s === "REFUNDED" ? "bg-surface-alt text-ink-muted" : "bg-brand-soft text-brand";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${c}`}>{STATUS_LABEL[s]}</span>;
}
