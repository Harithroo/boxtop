import Link from "next/link";
import { Truck, Banknote, Gift, Clock } from "lucide-react";
import { listBoxes, getCollections } from "@/lib/catalog";
import { BoxGrid } from "@/components/BoxCard";
import { getSettings } from "@/lib/settings";
import { colomboNow } from "@/lib/delivery";
import { db, schema } from "@/db";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, occasions, recipients, s] = await Promise.all([
    listBoxes({ featured: true, limit: 8 }),
    getCollections("OCCASION"),
    getCollections("RECIPIENT"),
    getSettings(),
  ]);
  const best = featured.length ? featured : await listBoxes({ limit: 8 });
  const now = colomboNow();
  const lastCutoff = (await db.select({ c: schema.deliverySlots.cutoff }).from(schema.deliverySlots).where(eq(schema.deliverySlots.active, true)).orderBy(asc(schema.deliverySlots.cutoff))).map((r) => r.c).filter((c) => c > now.time).pop();
  const sameDayOpen = s.delivery.sameDayEnabled && !!lastCutoff;

  return (
    <>
      <section className="container-bt pt-6">
        <div className="ribbon-frame px-6 py-10 sm:px-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent-soft">Taste for gift</p>
          <h1 className="mt-2 max-w-xl font-[family-name:var(--font-display)] text-[30px] font-semibold leading-[35px] min-[400px]:text-[40px] min-[400px]:leading-[44px]">
            Gift boxes made for their day
          </h1>
          <p className="mt-3 max-w-md opacity-90">Packed by hand in Piliyandala and delivered across Colombo and Sri Lanka, with your message inside.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/shop" className="btn bg-white text-brand hover:bg-brand-soft">Shop gift boxes</Link>
            <Link href="/custom" className="btn-accent">Start a custom order</Link>
          </div>
          {sameDayOpen && (
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
              <Clock size={16} /> Same-day delivery: order by {lastCutoff} today
            </p>
          )}
        </div>
      </section>

      {occasions.length > 0 && (
        <section className="container-bt mt-8">
          <p className="eyebrow">Shop by occasion</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {occasions.map((o) => <Link key={o.id} href={`/occasion/${o.slug}`} className="chip shrink-0">{o.name}</Link>)}
          </div>
        </section>
      )}

      <section className="container-bt mt-11">
        <p className="eyebrow">Best sellers</p>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="h2">Popular packages</h2>
          <Link href="/shop" className="text-sm font-bold text-brand">See all</Link>
        </div>
        <BoxGrid boxes={best} sameDayOpen={sameDayOpen} />
      </section>

      <section className="container-bt mt-11 grid gap-3 md:grid-cols-2">
        <Link href="/build" className="ribbon-frame block p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent-soft">New</p>
          <h2 className="h2 mt-1">Build your own box</h2>
          <p className="mt-1 opacity-90">Pick a size and fill it with their favourites. The price updates as you go.</p>
          <span className="btn mt-4 bg-white text-brand">Start building</span>
        </Link>
        <Link href="/gift-finder" className="card block p-6 sm:p-8 hover:shadow-[var(--shadow-raised)]">
          <p className="eyebrow">Not sure?</p>
          <h2 className="h2 mt-1">Try the gift finder</h2>
          <p className="mt-1 text-ink-muted">Three quick questions and we&apos;ll suggest the right box.</p>
          <span className="btn-outline mt-4">Find a gift</span>
        </Link>
      </section>

      {recipients.length > 0 && (
        <section className="container-bt mt-11">
          <p className="eyebrow">Who is it for?</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {recipients.map((r) => (
              <Link key={r.id} href={`/for/${r.slug}`} className="card flex min-h-20 items-center justify-center p-4 text-center font-bold hover:text-brand">{r.name}</Link>
            ))}
          </div>
        </section>
      )}

      <section className="container-bt mt-11">
        <div className="flex flex-col gap-4 rounded-lg bg-brand-deep p-6 text-on-brand sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="h2">Tell us who it&apos;s for</h2>
            <p className="mt-1 opacity-90">Share the occasion, budget and what they love. We&apos;ll build the box and send you a photo before it goes out.</p>
          </div>
          <Link href="/custom" className="btn-accent shrink-0">Start a custom order</Link>
        </div>
      </section>

      <section className="container-bt mt-11 grid gap-3 sm:grid-cols-3">
        {[
          [Truck, "Delivered on your date", "Pick a day and time slot at checkout."],
          [Banknote, "Cash on delivery or bank transfer", "Pay the way that suits you."],
          [Gift, "Your message inside", "A printed card with every box. Keep it a surprise if you like."],
        ].map(([Icon, t, d], i) => {
          const I = Icon as typeof Truck;
          return (
            <div key={i} className="card flex gap-3 p-4">
              <I className="shrink-0 text-brand" size={22} strokeWidth={1.75} />
              <div><p className="font-bold">{t as string}</p><p className="hint">{d as string}</p></div>
            </div>
          );
        })}
      </section>
    </>
  );
}
