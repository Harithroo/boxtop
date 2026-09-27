import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { saveFinderQuestion, deleteFinderQuestion, saveFinderAnswer, deleteFinderAnswer } from "@/app/actions/admin-extra";
export const dynamic = "force-dynamic";
export default async function Finder() {
  await requireAdmin();
  const [qs, as, boxes] = await Promise.all([
    db.select().from(schema.finderQuestions).orderBy(asc(schema.finderQuestions.sortOrder)),
    db.select().from(schema.finderAnswers).orderBy(asc(schema.finderAnswers.sortOrder)),
    db.select({ tags: schema.boxes.tags }).from(schema.boxes),
  ]);
  const allTags = [...new Set(boxes.flatMap((b) => (b.tags ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)))].sort();
  return (
    <div className="space-y-5">
      <h1 className="h1">Gift finder</h1>
      <div className="card space-y-1 p-4 text-sm">
        <p>Each answer lists the <b>box tags</b> it matches (set tags on each box). A box is shown when it matches every answer the customer picks. Leave an answer&apos;s tags empty to match everything.</p>
        <p>For budgets use a price range tag: <code>price:0-5000</code>, <code>price:5000-10000</code>, <code>price:20000-</code>.</p>
        {allTags.length > 0 && <p className="hint">Tags used on boxes: {allTags.join(", ")}</p>}
      </div>
      {qs.map((q) => (
        <section key={q.id} className="card p-4">
          <form action={saveFinderQuestion} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={q.id} />
            <input name="question" defaultValue={q.question} className="input flex-1 font-bold" aria-label="Question" />
            <input name="sortOrder" type="number" defaultValue={q.sortOrder} className="input w-20" aria-label="Order" />
            <button className="btn-outline btn-sm">Save</button>
          </form>
          <ul className="mt-3 space-y-2">
            {as.filter((a) => a.questionId === q.id).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2">
                <form action={saveFinderAnswer} className="flex flex-1 flex-wrap gap-2">
                  <input type="hidden" name="id" value={a.id} /><input type="hidden" name="questionId" value={q.id} />
                  <input name="label" defaultValue={a.label} className="input min-h-10 w-48 py-1 text-sm" aria-label="Answer" />
                  <input name="tags" defaultValue={a.tags} className="input min-h-10 flex-1 py-1 text-sm" placeholder="tags, comma separated" aria-label="Tags" />
                  <input name="sortOrder" type="number" defaultValue={a.sortOrder} className="input min-h-10 w-16 py-1 text-sm" aria-label="Order" />
                  <button className="btn-outline btn-sm">Save</button>
                </form>
                <form action={deleteFinderAnswer}><input type="hidden" name="id" value={a.id} /><button className="text-xs text-accent-text">Delete</button></form>
              </li>
            ))}
          </ul>
          <form action={saveFinderAnswer} className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
            <input type="hidden" name="questionId" value={q.id} />
            <input name="label" className="input min-h-10 w-48 py-1 text-sm" placeholder="New answer" aria-label="New answer" required />
            <input name="tags" className="input min-h-10 flex-1 py-1 text-sm" placeholder="tags" aria-label="Tags" />
            <button className="btn-primary btn-sm">Add answer</button>
          </form>
          <form action={deleteFinderQuestion} className="mt-2"><input type="hidden" name="id" value={q.id} /><button className="text-xs text-accent-text">Delete question</button></form>
        </section>
      ))}
      <form action={saveFinderQuestion} className="card flex flex-wrap gap-2 p-4">
        <input name="question" className="input flex-1" placeholder="New question, e.g. Who is it for?" required aria-label="New question" />
        <input name="sortOrder" type="number" defaultValue={qs.length} className="input w-20" aria-label="Order" />
        <button className="btn-primary btn-sm">Add question</button>
      </form>
    </div>
  );
}
