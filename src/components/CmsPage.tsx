import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export async function getPage(slug: string) {
  const [p] = await db.select().from(schema.pages).where(eq(schema.pages.slug, slug));
  return p ?? null;
}

/** Renders a page edited in admin. Body is plain text with blank lines between paragraphs and "## " headings. */
export async function CmsPage({ slug }: { slug: string }) {
  const p = await getPage(slug);
  if (!p) notFound();
  return (
    <div className="container-bt max-w-3xl py-8">
      <h1 className="h1 mb-4">{p.title}</h1>
      <div className="space-y-4">
        {p.body.split(/\n{2,}/).map((block, i) =>
          block.startsWith("## ") ? <h2 key={i} className="h2 pt-2">{block.slice(3)}</h2> : <p key={i} className="whitespace-pre-line">{block}</p>,
        )}
      </div>
    </div>
  );
}
