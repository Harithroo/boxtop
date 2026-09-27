import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
export const metadata = { title: "FAQ" };
export const dynamic = "force-dynamic";
export default async function Faq() {
  const faqs = await db.select().from(schema.faqs).orderBy(asc(schema.faqs.sortOrder));
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) };
  return (
    <div className="container-bt max-w-3xl py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <h1 className="h1 mb-6">Questions</h1>
      <div className="space-y-2">
        {faqs.map((f) => (
          <details key={f.id} className="card p-4"><summary className="cursor-pointer font-bold">{f.question}</summary><p className="mt-2 whitespace-pre-line text-ink-muted">{f.answer}</p></details>
        ))}
      </div>
    </div>
  );
}
