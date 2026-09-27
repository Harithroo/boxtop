import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { loadBoxFull } from "@/db/loaders";
import { requireAdmin } from "@/lib/auth";
import { BoxForm } from "@/components/admin/BoxForm";
import { duplicateBox } from "@/app/actions/admin-boxes";

export const dynamic = "force-dynamic";

export default async function EditBox({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const raw = (await params).id;
  const collections = await db.select().from(schema.collections).orderBy(asc(schema.collections.sortOrder));
  if (raw === "new") {
    return <div className="space-y-4"><Link href="/admin/boxes" className="text-sm text-brand">← Boxes</Link><h1 className="h1">New box</h1><BoxForm collections={collections} selected={[]} images={[]} contents="" /></div>;
  }
  const box = await loadBoxFull(eq(schema.boxes.id, Number(raw)));
  if (!box) notFound();
  const tierRows = await db.select().from(schema.priceTiers).where(eq(schema.priceTiers.boxId, box.id)).orderBy(asc(schema.priceTiers.minQty));
  const contents = box.contents.map((c) => `${c.quantity > 1 ? `${c.quantity} x ` : ""}${c.item.name}${c.item.size ? ` (${c.item.size})` : ""}`).join("\n");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/boxes" className="text-sm text-brand">← Boxes</Link>
        <h1 className="h1 mr-auto">{box.name}</h1>
        <Link href={`/box/${box.slug}`} target="_blank" className="btn-outline btn-sm">View on site</Link>
        <form action={duplicateBox}><input type="hidden" name="id" value={box.id} /><button className="btn-outline btn-sm">Duplicate</button></form>
      </div>
      <BoxForm box={box} collections={collections} selected={box.collections.map((c) => c.collectionId)} images={box.images} contents={contents} tiers={tierRows.map((t) => `${t.minQty}: ${t.unitPrice}`).join("\n")} />
    </div>
  );
}
