import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { CrudTable } from "@/components/admin/CrudTable";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireAdmin();
  const rows = await db.select().from(schema.collections).orderBy(asc(schema.collections.kind), asc(schema.collections.sortOrder));
  return <div className="space-y-4"><h1 className="h1">Collections</h1><p className="hint">Occasions and recipients each get their own page (/occasion/birthday, /for/mum). Tick boxes into them from the box editor.</p>
    <CrudTable entity="collections" rows={rows.map((r) => ({ ...r, _label: `${r.kind.toLowerCase()} · ${r.name}${r.showOnHome ? " · on home" : ""}` }))} /></div>;
}
