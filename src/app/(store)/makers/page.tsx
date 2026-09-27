import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
export const metadata = { title: "Our makers", description: "The Sri Lankan makers behind the treats in our gift boxes." };
export const dynamic = "force-dynamic";
export default async function Makers() {
  const makers = await db.select().from(schema.makers).orderBy(asc(schema.makers.name));
  return (
    <div className="container-bt py-8">
      <p className="eyebrow">Makers</p>
      <h1 className="h1">The people behind the box</h1>
      <p className="mt-2 max-w-2xl text-ink-muted">We fill our boxes with things made across Sri Lanka.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {makers.map((m) => (
          <article key={m.id} className="card overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {m.photo ? <img src={m.photo} alt="" className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] bg-surface-alt" />}
            <div className="p-4"><h2 className="font-bold">{m.name}</h2>{m.place && <p className="hint">{m.place}</p>}{m.story && <p className="mt-2 text-sm">{m.story}</p>}</div>
          </article>
        ))}
        {!makers.length && <p className="text-ink-muted">Maker stories are coming soon.</p>}
      </div>
    </div>
  );
}
