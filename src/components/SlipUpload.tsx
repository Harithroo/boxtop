"use client";
import { useActionState } from "react";
import { uploadSlip } from "@/app/actions/order";

export function SlipUpload({ number }: { number: string }) {
  const [s, action, pending] = useActionState(uploadSlip, {});
  if (s.ok) return <p className="rounded-md bg-brand-soft p-3 text-sm font-medium">Thank you. We&apos;ve got your slip and will confirm your order shortly.</p>;
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="number" value={number} />
      <label className="label" htmlFor="slip">Upload the payment slip</label>
      <input id="slip" name="slip" type="file" accept="image/*" required className="input py-2" />
      {s.error && <p role="alert" className="text-sm text-accent-text">{s.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Uploading…" : "Send slip"}</button>
    </form>
  );
}
