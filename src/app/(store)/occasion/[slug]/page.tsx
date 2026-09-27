import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Listing } from "@/components/Listing";
import { getCollection } from "@/lib/catalog";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ budget?: string; sort?: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = await getCollection("OCCASION", (await params).slug);
  return c ? { title: `${c.name} gift boxes`, description: c.intro?.slice(0, 160) } : {};
}

export default async function Page({ params, searchParams }: P) {
  const { slug } = await params;
  const c = await getCollection("OCCASION", slug);
  if (!c) notFound();
  const sp = await searchParams;
  return (
    <div className="container-bt py-8">
      <p className="eyebrow">Occasion</p>
      <h1 className="h1">{c.name}</h1>
      {c.intro && <p className="mt-2 max-w-2xl text-ink-muted">{c.intro}</p>}
      <div className="mt-5"><Listing basePath={`/occasion/${slug}`} sp={sp} collectionId={c.id} /></div>
    </div>
  );
}
