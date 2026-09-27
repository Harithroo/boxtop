"use client";
import { useActionState } from "react";
import type { SState } from "@/app/actions/admin-settings";

/** Small wrapper: a settings form with a save button and status line. */
export function SForm({ action, children, label = "Save", className = "" }: {
  action: (s: SState, fd: FormData) => Promise<SState>; children: React.ReactNode; label?: string; className?: string;
}) {
  const [s, act, pending] = useActionState(action, {});
  return (
    <form action={act} className={`space-y-3 ${className}`}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary btn-sm" disabled={pending}>{pending ? "Saving…" : label}</button>
        {s.error && <span role="alert" className="text-sm text-accent-text">{s.error}</span>}
        {s.ok && !s.error && <span className="text-sm text-success">{s.info ?? "Saved"}</span>}
      </div>
    </form>
  );
}

export function ActionButton({ action, label, className = "btn-outline btn-sm" }: { action: () => Promise<SState>; label: string; className?: string }) {
  const [s, act, pending] = useActionState(async () => action(), {});
  return (
    <form action={act} className="inline-flex items-center gap-2">
      <button className={className} disabled={pending}>{label}</button>
      {s.info && <span className="text-sm text-success">{s.info}</span>}
    </form>
  );
}
