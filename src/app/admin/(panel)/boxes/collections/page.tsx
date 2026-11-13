import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { CrudTable } from "@/components/admin/CrudTable";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireAdmin();
  const rows = await db.select().from(schema.collections).orderBy(asc(schema.collections.kind), asc(schema.collections.sortOrder));
  return <div className="space-y-4"><h1 className="h1">Collections</h1><p className="hint">Occasions and recipients each get their own page (/occasion/birthday, /for/mum). Tick boxes into them from the box editor. An occasion with a date rule appears on the home page&apos;s year dial: <b>fixed:12-25</b> for the same date every year, <b>nth:5-0-2</b> for the 2nd Sunday of May, <b>list:2026-11-08,2027-10-28</b> for dates that move with the moon.</p>
    <CrudTable entity="collections" rows={rows.map((r) => ({ ...r, _label: `#${r.id} ${r.kind.toLowerCase()} · ${r.name}${r.dateRule ? ` · ${r.dateRule}` : ""}${r.showOnHome ? " · home shelf" : ""}` }))} /></div>;
}
