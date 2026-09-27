import "server-only";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { listBoxes } from "./catalog";

export async function getFinder() {
  const [qs, as] = await Promise.all([
    db.select().from(schema.finderQuestions).orderBy(asc(schema.finderQuestions.sortOrder)),
    db.select().from(schema.finderAnswers).orderBy(asc(schema.finderAnswers.sortOrder)),
  ]);
  return qs.map((q) => ({ ...q, answers: as.filter((a) => a.questionId === q.id) })).filter((q) => q.answers.length);
}

const splitTags = (s: string | null) => (s ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

/** Each chosen answer must match: a box tag in the answer's tags, or its price inside a "price:min-max" tag. Empty answers match everything. */
export async function findBoxes(answerIds: number[]) {
  const all = await db.select().from(schema.finderAnswers);
  const chosen = all.filter((a) => answerIds.includes(a.id));
  const boxes = await listBoxes({});
  const scored = boxes.map((b) => {
    const tags = splitTags(b.tags);
    let hits = 0;
    for (const a of chosen) {
      const want = splitTags(a.tags);
      if (!want.length) { hits++; continue; }
      const ok = want.some((w) => {
        const m = w.match(/^price:(\d*)-(\d*)$/);
        if (m) return b.price >= Number(m[1] || 0) && b.price <= Number(m[2] || Infinity);
        return tags.includes(w);
      });
      if (ok) hits++;
    }
    return { box: b, hits };
  });
  const exact = scored.filter((s) => s.hits === chosen.length).map((s) => s.box);
  const close = scored.filter((s) => s.hits < chosen.length && s.hits >= Math.max(1, chosen.length - 1)).sort((a, b) => b.hits - a.hits).map((s) => s.box).slice(0, 8);
  return { chosen, exact, close };
}
