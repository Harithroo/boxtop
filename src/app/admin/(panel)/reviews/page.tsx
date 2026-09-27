import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { moderateReview } from "@/app/actions/admin-extra";
export const dynamic = "force-dynamic";
export default async function Reviews() {
  await requireAdmin();
  const rows = await db.select({ r: schema.reviews, box: schema.boxes.name, number: schema.orders.number, orderId: schema.orders.id })
    .from(schema.reviews).leftJoin(schema.boxes, eq(schema.boxes.id, schema.reviews.boxId)).innerJoin(schema.orders, eq(schema.orders.id, schema.reviews.orderId))
    .orderBy(schema.reviews.approved, desc(schema.reviews.id)).limit(200);
  return (
    <div className="space-y-4">
      <h1 className="h1">Reviews</h1>
      <p className="hint">Only customers with delivered orders can review (the link is in the delivered message). Nothing shows on the site until you approve it.</p>
      {rows.map(({ r, box, number, orderId }) => (
        <article key={r.id} className={`card p-4 ${r.approved ? "" : "ring-2 ring-accent"}`}>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-accent">{"★".repeat(r.rating)}<span className="text-line">{"★".repeat(5 - r.rating)}</span></span>
            <b>{r.name}</b><span>on {box ?? "a build-your-own box"}</span>
            <Link href={`/admin/orders/${orderId}`} className="text-brand">{number}</Link>
            <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${r.approved ? "bg-[#E3F2EA] text-success" : "bg-accent-soft text-accent-text"}`}>{r.approved ? "Showing" : "Waiting"}</span>
          </div>
          {r.body && <p className="mt-2 text-sm">{r.body}</p>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {r.photo && <img src={r.photo} alt="" className="mt-2 h-28 rounded-md object-cover" />}
          <form action={moderateReview} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="id" value={r.id} />
            <input name="reply" defaultValue={r.reply ?? ""} className="input min-h-10 flex-1 py-1 text-sm" placeholder="Public reply (optional)" aria-label="Reply" />
            <button name="op" value="approve" className="btn-primary btn-sm">{r.approved ? "Save reply" : "Approve"}</button>
            {r.approved && <button name="op" value="hide" className="btn-outline btn-sm">Hide</button>}
            <button name="op" value="delete" className="btn-sm btn text-accent-text">Delete</button>
          </form>
        </article>
      ))}
      {!rows.length && <p className="hint">No reviews yet.</p>}
    </div>
  );
}
