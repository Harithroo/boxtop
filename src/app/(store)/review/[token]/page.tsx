import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { loadOrder } from "@/db/loaders";
import { ReviewForm } from "@/components/ReviewForm";

export const metadata = { title: "Review your order", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Review({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const o = await loadOrder(eq(schema.orders.reviewToken, token));
  if (!o) notFound();
  const done = await db.select().from(schema.reviews).where(eq(schema.reviews.orderId, o.id));
  const targets = [
    ...[...new Map(o.lines.filter((l) => l.boxId).map((l) => [l.boxId!, l.name])).entries()].map(([boxId, name]) => ({ boxId: boxId as number | null, name })),
    ...(o.lines.some((l) => l.builderSizeId) ? [{ boxId: null, name: "Your build-your-own box" }] : []),
  ].filter((t) => !done.some((d) => d.boxId === t.boxId));
  const first = o.customer.name.split(" ")[0];
  return (
    <div className="container-bt max-w-2xl py-8">
      <p className="eyebrow">Order {o.number}</p>
      <h1 className="h1">How did we do?</h1>
      {o.status !== "DELIVERED" ? <p className="mt-3 text-ink-muted">You can review this order once it&apos;s delivered.</p>
        : targets.length === 0 ? <p className="mt-3 text-ink-muted">Thank you, you&apos;ve reviewed everything in this order.</p>
        : <div className="mt-6 space-y-4">{targets.map((t) => <ReviewForm key={String(t.boxId)} token={token} boxId={t.boxId} title={t.name} defaultName={first} />)}</div>}
    </div>
  );
}
