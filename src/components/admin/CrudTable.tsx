"use client";
import { useActionState, useState } from "react";
import { saveRow, deleteRow } from "@/app/actions/crud";
import { SPECS, type Entity, type Field } from "@/lib/crud-spec";

type Row = Record<string, unknown> & { id: number };

function toInput(f: Field, v: unknown) {
  if (v == null) return "";
  if (f.type === "datetime") { const d = new Date(v as string); return isNaN(+d) ? "" : new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
  return String(v);
}

function FieldInput({ f, v }: { f: Field; v: unknown }) {
  const common = { name: f.name, required: f.required, placeholder: f.placeholder, "aria-label": f.label };
  if (f.type === "image") return (
    <span className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {typeof v === "string" && v && <img src={v} alt="" className="h-10 w-10 rounded object-cover" />}
      <input type="file" name={f.name} accept="image/*" className="input min-h-10 py-1 text-sm" aria-label={f.label} />
      {typeof v === "string" && v && <label className="flex items-center gap-1 text-xs"><input type="checkbox" name={`${f.name}__remove`} /> Remove</label>}
    </span>
  );
  if (f.type === "bool") return <input type="checkbox" name={f.name} defaultChecked={v == null ? true : !!v} className="h-5 w-5" aria-label={f.label} />;
  if (f.type === "select") return <select {...common} defaultValue={toInput(f, v)} className="input min-h-10 py-1 text-sm">{f.options!.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ").toLowerCase()}</option>)}</select>;
  if (f.type === "textarea") return <textarea {...common} defaultValue={toInput(f, v)} rows={f.name === "body" ? 10 : 2} className="input text-sm" />;
  const type = f.type === "datetime" ? "datetime-local" : f.type;
  return <input {...common} type={type} defaultValue={toInput(f, v)} className="input min-h-10 py-1 text-sm" />;
}

function RowForm({ entity, row, onDone }: { entity: Entity; row?: Row; onDone?: () => void }) {
  const [s, action, pending] = useActionState(saveRow, {});
  const fields = SPECS[entity].fields as Field[];
  if (s.ok && onDone) queueMicrotask(onDone);
  return (
    <form action={action} className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <input type="hidden" name="_entity" value={entity} />
      <input type="hidden" name="_id" value={row?.id ?? ""} />
      {fields.map((f) => (
        <label key={f.name} className={`block text-sm ${f.type === "textarea" ? "sm:col-span-2 lg:col-span-4" : ""} ${f.type === "bool" ? "flex items-center gap-2 self-end pb-2" : ""}`}>
          {f.type === "bool" ? <><FieldInput f={f} v={row?.[f.name]} /> {f.label}</> : <><span className="label">{f.label}</span><FieldInput f={f} v={row?.[f.name]} /></>}
        </label>
      ))}
      <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-4">
        <button className="btn-primary btn-sm" disabled={pending}>{row ? "Save" : "Add"}</button>
        {s.error && <span className="text-sm text-accent-text">{s.error}</span>}
        {s.ok && !onDone && <span className="text-sm text-success">Saved</span>}
      </div>
    </form>
  );
}

/** rows carry a precomputed `_label` (functions can't cross from server to client). */
export function CrudTable({ entity, rows }: { entity: Entity; rows: Row[] }) {
  const [open, setOpen] = useState<number | "new" | null>(null);
  return (
    <section className="card">
      <div className="flex items-center justify-between border-b border-line p-4">
        <h2 className="h2">{SPECS[entity].title}</h2>
        <button className="btn-outline btn-sm" onClick={() => setOpen(open === "new" ? null : "new")}>{open === "new" ? "Close" : "+ Add"}</button>
      </div>
      {open === "new" && <div className="border-b border-line bg-page"><RowForm entity={entity} onDone={() => setOpen(null)} /></div>}
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id}>
            <div className="flex items-center gap-3 px-4 py-3 text-sm">
              <button className="flex-1 text-left" onClick={() => setOpen(open === r.id ? null : r.id)}>{String(r._label ?? r.id)}</button>
              <form action={deleteRow} onSubmit={(e) => { if (!window.confirm("Delete this?")) e.preventDefault(); }}>
                <input type="hidden" name="_entity" value={entity} /><input type="hidden" name="_id" value={r.id} />
                <button className="text-xs text-accent-text">Delete</button>
              </form>
            </div>
            {open === r.id && <div className="bg-page"><RowForm entity={entity} row={r} /></div>}
          </li>
        ))}
        {!rows.length && <li className="p-4 text-sm text-ink-muted">Nothing yet.</li>}
      </ul>
    </section>
  );
}
