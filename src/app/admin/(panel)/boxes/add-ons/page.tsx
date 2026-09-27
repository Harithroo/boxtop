import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { CrudTable } from "@/components/admin/CrudTable";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireAdmin();
  const rows = await db.select().from(schema.addOns).orderBy(asc(schema.addOns.sortOrder));
  return <div className="space-y-4"><h1 className="h1">Add-ons</h1><p className="hint">Cards, balloons, chocolates and flowers offered on every box page and in the cart.</p>
    <CrudTable entity="addOns" rows={rows.map((r) => ({ ...r, _label: `${r.name} · Rs. ${r.price.toLocaleString("en-LK")}${r.active ? "" : " · off"}` }))} /></div>;
}
