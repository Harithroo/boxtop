import Link from "next/link";
import { getFinder, findBoxes } from "@/lib/finder";
import { GiftFinder } from "@/components/GiftFinder";
import { BoxGrid } from "@/components/BoxCard";

export const metadata = { title: "Gift finder", description: "Answer three quick questions and we'll suggest the right gift box." };
export const dynamic = "force-dynamic";

export default async function Finder({ searchParams }: { searchParams: Promise<{ a?: string }> }) {
  const { a } = await searchParams;
  const questions = await getFinder();
  if (a === undefined) {
    return (
      <div className="container-bt py-8">
        <div className="mb-6 text-center"><p className="eyebrow">Gift finder</p><h1 className="h1">Not sure what to send?</h1><p className="mt-2 text-ink-muted">Answer a few quick questions and we&apos;ll suggest boxes.</p></div>
        {questions.length ? <GiftFinder questions={questions.map((q) => ({ id: q.id, question: q.question, answers: q.answers.map((x) => ({ id: x.id, label: x.label })) }))} />
          : <p className="text-center text-ink-muted">The gift finder is being set up. <Link href="/shop" className="font-bold text-brand">Browse all boxes</Link>.</p>}
      </div>
    );
  }
  const ids = a.split(",").map(Number).filter(Boolean);
  const { chosen, exact, close } = await findBoxes(ids);
  return (
    <div className="container-bt py-8">
      <p className="eyebrow">Gift finder</p>
      <h1 className="h1">{exact.length ? "Boxes we think they'll love" : "Nothing matches everything"}</h1>
      {chosen.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{chosen.map((c) => <span key={c.id} className="chip chip-on">{c.label}</span>)}<Link href="/gift-finder" className="chip">Start again</Link></div>}
      <div className="mt-6"><BoxGrid boxes={exact.length ? exact : close} sameDayOpen /></div>
      {!exact.length && close.length > 0 && <p className="hint mt-3">These are the closest matches.</p>}
      <div className="mt-10 rounded-lg bg-brand-deep p-6 text-on-brand">
        <h2 className="h2">Still not quite right?</h2>
        <p className="mt-1 opacity-90">Build your own box, or tell us about them and we&apos;ll make one.</p>
        <div className="mt-4 flex flex-wrap gap-3"><Link href="/build" className="btn bg-white text-brand">Build your own</Link><Link href="/custom" className="btn-accent">Custom order</Link></div>
      </div>
    </div>
  );
}
