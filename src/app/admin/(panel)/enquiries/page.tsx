import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { waLink, prettyDate } from "@/lib/format";
import { setEnquiryStatus } from "@/app/actions/admin-settings";

export const dynamic = "force-dynamic";

export default async function Enquiries() {
  await requireAdmin();
  const rows = await db.select().from(schema.enquiries).orderBy(desc(schema.enquiries.id)).limit(200);
  return (
    <div className="space-y-4">
      <h1 className="h1">Enquiries</h1>
      <p className="hint">Custom orders, corporate requests and contact messages. Reply on WhatsApp, then create a manual order when they confirm.</p>
      <div className="space-y-3">
        {rows.map((e) => (
          <article key={e.id} className={`card p-4 ${e.status === "new" ? "ring-2 ring-accent" : ""}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge">{e.kind.toLowerCase()}</span>
              <b>{e.name}</b>{e.company && <span>· {e.company}</span>}
              <span className="hint ml-auto">{e.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short" })}</span>
            </div>
            <p className="mt-2 text-sm">{[e.occasion, e.budget, e.date && `needed ${prettyDate(e.date)}`, e.quantity && `${e.quantity} boxes`].filter(Boolean).join(" · ")}</p>
            <p className="mt-1 whitespace-pre-line text-sm">{e.message}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {e.photo && <a href={e.photo} target="_blank"><img src={e.photo} alt="Reference" className="mt-2 h-28 rounded-md object-cover" /></a>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a href={waLink(e.phone, `Hi ${e.name}, this is Boxtop about your ${e.kind === "CORPORATE" ? "corporate gifting" : "custom box"} request.`)} target="_blank" rel="noopener" className="btn-sm btn bg-[#1E7A4C] text-white">WhatsApp +{e.phone}</a>
              {e.email && <a href={`mailto:${e.email}`} className="btn-outline btn-sm">Email</a>}
              <form action={setEnquiryStatus} className="ml-auto flex gap-2">
                <input type="hidden" name="id" value={e.id} />
                <select name="status" defaultValue={e.status} className="input min-h-9 py-1 text-sm"><option value="new">New</option><option value="replied">Replied</option><option value="won">Became an order</option><option value="closed">Closed</option></select>
                <button className="btn-outline btn-sm">Update</button>
              </form>
            </div>
          </article>
        ))}
        {!rows.length && <p className="hint">No enquiries yet.</p>}
      </div>
    </div>
  );
}
