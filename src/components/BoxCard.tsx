import Link from "next/link";
import { priceText, rs } from "@/lib/format";
import { GiftArt } from "./GiftArt";

export type CardBox = {
  id: number; slug: string; name: string; code: string | null; summary: string | null; price: number; priceOnRequest?: boolean;
  compareAtPrice: number | null; badge: string | null; sameDay: boolean; leadDays: number; stock: number | null;
  images: { url: string; alt: string | null }[];
};

/** A box as a paper print with a kraft price tag, the same card the home page hangs on its ribbon. */
export function BoxCard({ box, sameDayOpen }: { box: CardBox; sameDayOpen?: boolean }) {
  const img = box.images[0];
  const soldOut = box.stock !== null && box.stock <= 0;
  return (
    <Link href={`/box/${box.slug}`} className="pcard">
      <div className="pcard-ph">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img ? <img src={img.url} alt={img.alt ?? box.name} loading="lazy" /> : <GiftArt seed={box.id} className="h-full w-full" />}
        {(box.badge || soldOut) && (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {box.badge && <span className="badge">{box.badge}</span>}
            {soldOut && <span className="badge bg-ink text-page dark:bg-page dark:text-ink">Sold out</span>}
          </div>
        )}
      </div>
      <span className="ptag">{priceText(box)}</span>
      <h3>{box.name}</h3>
      {box.summary && <p className="line-clamp-2">{box.summary}</p>}
      <p className="pcard-meta">
        {!box.priceOnRequest && box.compareAtPrice && box.compareAtPrice > box.price && <s>{rs(box.compareAtPrice)}</s>}
        <span>{box.sameDay && box.leadDays === 0 && sameDayOpen ? "Same-day delivery" : box.leadDays > 0 ? `Delivers in ${box.leadDays}+ days` : "Next-day delivery"}</span>
      </p>
    </Link>
  );
}

export function BoxGrid({ boxes, sameDayOpen }: { boxes: CardBox[]; sameDayOpen?: boolean }) {
  if (!boxes.length) return <p className="py-10 text-center text-ink-muted">No boxes here yet. Try another filter, or ask us for a custom box.</p>;
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 min-[720px]:grid-cols-3 min-[1080px]:grid-cols-4 sm:gap-x-7">
      {boxes.map((b) => <BoxCard key={b.id} box={b} sameDayOpen={sameDayOpen} />)}
    </div>
  );
}
