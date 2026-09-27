"use client";
import { useActionState, useState } from "react";
import { submitReview } from "@/app/actions/review";

export function ReviewForm({ token, boxId, title, defaultName }: { token: string; boxId: number | null; title: string; defaultName: string }) {
  const [s, action, pending] = useActionState(submitReview, {});
  const [rating, setRating] = useState(0);
  if (s.ok) return <div className="card p-5"><p className="font-bold">{title}</p><p className="mt-1 text-sm text-success">Thank you! Your review will appear once we&apos;ve checked it.</p></div>;
  return (
    <form action={action} className="card space-y-3 p-5">
      <input type="hidden" name="token" value={token} /><input type="hidden" name="boxId" value={boxId ?? ""} /><input type="hidden" name="rating" value={rating} />
      <p className="font-bold">{title}</p>
      <div role="radiogroup" aria-label="Rating" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}
            className={`h-11 w-11 text-3xl leading-none ${n <= rating ? "text-accent" : "text-line"}`}>★</button>
        ))}
      </div>
      <textarea name="body" rows={3} className="input" placeholder="What did they think? How was the delivery?" aria-label="Review" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Name to show</label><input name="name" defaultValue={defaultName} className="input" required /></div>
        <div><label className="label">Photo (optional)</label><input type="file" name="photo" accept="image/*" className="input py-2" /></div>
      </div>
      {s.error && <p role="alert" className="text-sm text-accent-text">{s.error}</p>}
      <button className="btn-primary" disabled={pending}>Send review</button>
    </form>
  );
}
