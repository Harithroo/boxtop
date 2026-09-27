import Link from "next/link";
import Image from "next/image";
import { rs } from "@/lib/format";
import { GiftArt } from "./GiftArt";

export type CardBox = {
  id: number; slug: string; name: string; code: string | null; summary: string | null; price: number;
  compareAtPrice: number | null; badge: string | null; sameDay: boolean; leadDays: number; stock: number | null;
  images: { url: string; alt: string | null }[];
};

export function BoxCard({ box, sameDayOpen }: { box: CardBox; sameDayOpen?: boolean }) {
  const img = box.images[0];
  const soldOut = box.stock !== null && box.stock <= 0;
  return (
    <Link href={`/box/${box.slug}`} className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-raised)]">
      <div className="relative aspect-square bg-surface-alt">
        {img ? (
          <Image src={img.url} alt={img.alt ?? box.name} fill sizes="(min-width:1080px) 25vw, (min-width:720px) 33vw, 50vw" className="object-cover" unoptimized />
        ) : (
          <GiftArt seed={box.id} className="h-full w-full" />
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {box.badge && <span className="badge">{box.badge}</span>}
          {soldOut && <span className="badge bg-ink">Sold out</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="text-base font-bold leading-[21px]">{box.name}</h3>
        {box.summary && <p className="hint line-clamp-2">{box.summary}</p>}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="price">{rs(box.price)}</span>
          {box.compareAtPrice && box.compareAtPrice > box.price && <s className="text-sm text-ink-muted">{rs(box.compareAtPrice)}</s>}
        </div>
        <p className="text-[13px] font-medium text-success">
          {box.sameDay && box.leadDays === 0 && sameDayOpen ? "Same-day delivery available" : box.leadDays > 0 ? `Delivers in ${box.leadDays}+ days` : "Next-day delivery"}
        </p>
      </div>
    </Link>
  );
}

export function BoxGrid({ boxes, sameDayOpen }: { boxes: CardBox[]; sameDayOpen?: boolean }) {
  if (!boxes.length) return <p className="py-10 text-center text-ink-muted">No boxes here yet. Try another filter, or ask us for a custom box.</p>;
  return (
    <div className="grid grid-cols-2 gap-3 min-[720px]:grid-cols-3 min-[1080px]:grid-cols-4">
      {boxes.map((b) => <BoxCard key={b.id} box={b} sameDayOpen={sameDayOpen} />)}
    </div>
  );
}
