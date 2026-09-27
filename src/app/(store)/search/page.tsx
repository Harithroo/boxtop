import { Listing } from "@/components/Listing";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; budget?: string; sort?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="container-bt py-8">
      <h1 className="h1 mb-4">Search</h1>
      <form action="/search" className="mb-6 flex gap-2">
        <label htmlFor="sq" className="sr-only">Search</label>
        <input id="sq" name="q" defaultValue={sp.q} placeholder="Box name, item or package number (e.g. 15)" className="input" autoFocus />
        <button className="btn-primary">Search</button>
      </form>
      {sp.q ? <Listing basePath="/search" sp={sp} /> : <p className="text-ink-muted">Search by name, what&apos;s inside, or the package number from our posts.</p>}
    </div>
  );
}
