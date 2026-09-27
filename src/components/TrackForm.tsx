"use client";
import { useActionState } from "react";
import { trackOrder } from "@/app/actions/order";

export function TrackForm({ order }: { order?: string }) {
  const [s, action, pending] = useActionState(trackOrder, {});
  return (
    <form action={action} className="card max-w-md space-y-3 p-5">
      <div><label className="label" htmlFor="order">Order number</label><input id="order" name="order" className="input uppercase" defaultValue={order} placeholder="BX-10235" required /></div>
      <div><label className="label" htmlFor="phone">Mobile number used on the order</label><input id="phone" name="phone" className="input" inputMode="tel" required /></div>
      {s.error && <p role="alert" className="text-sm text-accent-text">{s.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>Track order</button>
    </form>
  );
}
