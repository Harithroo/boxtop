#!/usr/bin/env node
// Every page in shell-map.json needs a seo.json entry: title <= 60 chars, description 120-160, both unique.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(readFileSync(path.join(TOOLS, f), 'utf8'));
const pages = Object.keys(read('shell-map.json').pages ?? {});
const seo = read('seo.json');
const entries = seo.pages ?? {};
const errors = [];
const warnings = [];
const seenTitle = new Map();
const seenDesc = new Map();

for (const p of pages) {
  const e = entries[p];
  if (!e) { errors.push(`${p}: no seo.json entry`); continue; }
  const t = e.title ?? '', d = e.description ?? '';
  if (!t) errors.push(`${p}: empty title`);
  else if (t.length > 60) errors.push(`${p}: title is ${t.length} chars (max 60)`);
  if (d.length < 120 || d.length > 160) errors.push(`${p}: description is ${d.length} chars (need 120-160)`);
  if (seenTitle.has(t)) errors.push(`${p}: title duplicates ${seenTitle.get(t)}`); else seenTitle.set(t, p);
  if (seenDesc.has(d)) errors.push(`${p}: description duplicates ${seenDesc.get(d)}`); else seenDesc.set(d, p);
}
for (const p of Object.keys(entries)) if (!pages.includes(p)) warnings.push(`${p}: seo.json entry for a page not in shell-map.json`);
if (seo.staging !== true) warnings.push('seo.json: "staging" is not true, pages will be indexable');

for (const w of warnings) console.warn(`check-seo: warning: ${w}`);
for (const e of errors) console.error(`check-seo: ${e}`);
if (errors.length) process.exit(1);
console.log(`check-seo: ${pages.length} page(s), ${errors.length} errors, ${warnings.length} warnings`);
