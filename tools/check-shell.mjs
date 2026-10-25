#!/usr/bin/env node
// Verifies every page in tools/shell-map.json exists and carries the partial markers its variant needs.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MARKERS, VARIANTS } from './shell-variants.mjs';

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TOOLS, '..');
const map = JSON.parse(readFileSync(path.join(TOOLS, 'shell-map.json'), 'utf8'));
const pages = map.pages ?? {};
const problems = [];

for (const [pagePath, variantName] of Object.entries(pages)) {
  const variant = VARIANTS[variantName];
  if (!variant) { problems.push(`${pagePath}: unknown variant "${variantName}"`); continue; }
  const abs = path.join(ROOT, pagePath);
  if (!existsSync(abs)) { problems.push(`${pagePath}: listed in shell-map.json but not on disk`); continue; }
  const html = readFileSync(abs, 'utf8');
  let last = -1;
  for (const name of MARKERS) {
    if (!variant[name]) continue;
    const open = html.indexOf(`<!-- partial: ${name} -->`);
    const close = html.indexOf(`<!-- /partial: ${name} -->`);
    if (open < 0 || close < open) { problems.push(`${pagePath}: missing or malformed partial markers for "${name}"`); continue; }
    if (open < last) problems.push(`${pagePath}: partial "${name}" is out of order`);
    last = open;
  }
  if (!/<body[^>]*\sdata-page="/.test(html)) problems.push(`${pagePath}: <body> has no data-page attribute`);
}

const htmlDir = path.join(ROOT, 'html');
if (existsSync(htmlDir)) {
  for (const f of readdirSync(htmlDir).filter((f) => f.endsWith('.html'))) {
    if (!(`html/${f}` in pages)) problems.push(`html/${f}: on disk but not listed in shell-map.json`);
  }
}

if (problems.length) { for (const p of problems) console.error(`check-shell: ${p}`); process.exit(1); }
console.log(`check-shell: ${Object.keys(pages).length} page(s) OK`);
