"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Q = { id: number; question: string; answers: { id: number; label: string }[] };

export function GiftFinder({ questions }: { questions: Q[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const q = questions[step];
  const choose = (id: number) => {
    const next = [...picks.slice(0, step), id];
    if (step + 1 < questions.length) { setPicks(next); setStep(step + 1); }
    else router.push(`/gift-finder?a=${next.join(",")}`);
  };
  return (
    <div className="card mx-auto max-w-xl p-6">
      <p className="hint">Question {step + 1} of {questions.length}</p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-alt"><div className="h-full bg-accent transition-all" style={{ width: `${(step / questions.length) * 100}%` }} /></div>
      <h2 className="h2 mt-5">{q.question}</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {q.answers.map((a) => <button key={a.id} type="button" onClick={() => choose(a.id)} className="btn-outline justify-start text-left">{a.label}</button>)}
      </div>
      <div className="mt-4 flex justify-between text-sm">
        {step > 0 ? <button type="button" className="font-bold text-brand" onClick={() => setStep(step - 1)}>← Back</button> : <span />}
        <button type="button" className="text-ink-muted" onClick={() => router.push(`/gift-finder?a=${picks.slice(0, step).join(",") || "0"}`)}>Skip to results</button>
      </div>
    </div>
  );
}
