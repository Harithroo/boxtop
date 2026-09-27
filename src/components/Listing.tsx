import Link from "next/link";
import { BUDGETS, SORTS, listBoxes } from "@/lib/catalog";
import { BoxGrid } from "./BoxCard";

type SP = { budget?: string; sort?: string; q?: string };

export async function Listing({ basePath, sp, collectionId }: { basePath: string; sp: SP; collectionId?: number }) {
  const boxes = await listBoxes({ collectionId, budget: sp.budget, sort: sp.sort, q: sp.q });
  const href = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    const s = p.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={href({ budget: undefined })} className={`chip ${!sp.budget ? "chip-on" : ""}`}>Any budget</Link>
        {BUDGETS.map((b) => (
          <Link key={b.id} href={href({ budget: b.id })} className={`chip ${sp.budget === b.id ? "chip-on" : ""}`}>{b.label}</Link>
        ))}
        <form className="ml-auto" action={basePath}>
          {sp.budget && <input type="hidden" name="budget" value={sp.budget} />}
          {sp.q && <input type="hidden" name="q" value={sp.q} />}
          <label className="sr-only" htmlFor="sort">Sort</label>
          <select id="sort" name="sort" defaultValue={sp.sort ?? "popular"} className="input min-h-10 py-1.5 text-sm">
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <noscript><button className="btn-outline btn-sm ml-2">Sort</button></noscript>
        </form>
      </div>
      <p className="hint mb-3">{boxes.length} {boxes.length === 1 ? "box" : "boxes"}</p>
      <BoxGrid boxes={boxes} sameDayOpen />
      <SortAutoSubmit />
    </>
  );
}

function SortAutoSubmit() {
  return <script dangerouslySetInnerHTML={{ __html: `document.getElementById('sort')?.addEventListener('change',e=>e.target.form.submit())` }} />;
}
