import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { CrudTable } from "@/components/admin/CrudTable";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireAdmin();
  const [pages, faqs] = await Promise.all([db.select().from(schema.pages), db.select().from(schema.faqs).orderBy(asc(schema.faqs.sortOrder))]);
  return <div className="space-y-5"><h1 className="h1">Content</h1><p className="hint">The announcement bar and contact details are under Settings → Store.</p>
    <CrudTable entity="pages" rows={pages.map((r) => ({ ...r, _label: `/${r.slug} · ${r.title}` }))} />
    <CrudTable entity="faqs" rows={faqs.map((r) => ({ ...r, _label: r.question }))} /></div>;
}
