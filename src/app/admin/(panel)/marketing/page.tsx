import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { CrudTable } from "@/components/admin/CrudTable";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireAdmin();
  const rows = await db.select().from(schema.coupons).orderBy(desc(schema.coupons.id));
  const fmt = (r: (typeof rows)[number]) => r.type === "PERCENT" ? `${r.value}% off` : r.type === "FIXED" ? `Rs. ${r.value} off` : "free delivery";
  return <div className="space-y-4"><h1 className="h1">Coupons</h1><p className="hint">Tip: a first-order code for the Facebook launch post, e.g. WELCOME10.</p>
    <CrudTable entity="coupons" rows={rows.map((r) => ({ ...r, _label: `${r.code} · ${fmt(r)} · used ${r.used}${r.usageLimit ? `/${r.usageLimit}` : ""}${r.active ? "" : " · off"}` }))} /></div>;
}
