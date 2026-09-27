import Link from "next/link";
import { asc } from "drizzle-orm";
import { schema } from "@/db";
import { loadBoxes } from "@/db/loaders";
import { requireAdmin } from "@/lib/auth";
import { rs } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Boxes() {
  await requireAdmin();
  const boxes = await loadBoxes(undefined, [asc(schema.boxes.sortOrder), asc(schema.boxes.name)]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="h1 mr-auto">Boxes</h1>
        <Link href="/admin/boxes/collections" className="btn-outline btn-sm">Collections</Link>
        <Link href="/admin/boxes/add-ons" className="btn-outline btn-sm">Add-ons</Link>
        <Link href="/admin/boxes/new" className="btn-primary btn-sm">+ New box</Link>
      </div>
      <div className="overflow-x-auto rounded-lg bg-surface shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-surface-alt"><tr>{["", "Box", "Price", "Stock", "Status"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {boxes.map((b) => (
              <tr key={b.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <td className="w-14 p-2">{b.images[0] ? <img src={b.images[0].url} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-surface-alt" />}</td>
                <td className="p-3"><Link href={`/admin/boxes/${b.id}`} className="font-bold text-brand">{b.name}</Link>{b.code && <span className="hint block">{b.code}</span>}</td>
                <td className="p-3">{rs(b.price)}</td>
                <td className="p-3">{b.stock ?? "–"}</td>
                <td className="p-3">{b.status === "ACTIVE" ? "Live" : b.status === "DRAFT" ? "Draft" : "Archived"}{b.featured && " · best seller"}</td>
              </tr>
            ))}
            {!boxes.length && <tr><td colSpan={5} className="p-6 text-center text-ink-muted">No boxes yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
