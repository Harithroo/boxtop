#!/usr/bin/env node
// Checks every local href/src in the pages listed in shell-map.json: the target file exists, #fragments exist
// (in the target page, or the page itself for sprite <use href="#i-x">), and no root-absolute URLs sneak in.
// External links (http, https, mailto, tel, data) are not fetched. Bare href="#" is a warning; links whose
// href is filled from config (data-cfg-attr="href:...") are exempt.
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TOOLS, '..');
const pages = Object.keys(JSON.parse(readFileSync(path.join(TOOLS, 'shell-map.json'), 'utf8')).pages ?? {});
const errors = [], warnings = [];
let checked = 0;
const idCache = new Map();
const idsOf = (abs) => {
  if (!idCache.has(abs)) idCache.set(abs, new Set([...readFileSync(abs, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return idCache.get(abs);
};

for (const page of pages) {
  const abs = path.join(ROOT, page);
  if (!existsSync(abs)) continue; // check-shell reports missing pages
  const html = readFileSync(abs, 'utf8');
  const syncRoot = html.match(/<!-- sync-root: (\S+) -->/)?.[1];
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  for (const tag of withoutComments.matchAll(/<[a-zA-Z][^>]*>/g)) {
    const cfgAttrs = tag[0].match(/data-cfg-attr="([^"]*)"/)?.[1] ?? '';
    for (const m of tag[0].matchAll(/\s(href|src)="([^"]*)"/g)) {
      const [, attr, raw] = m;
      if (cfgAttrs.split(';').some((p) => p.trim().startsWith(attr + ':'))) continue;
      if (raw === '#') { warnings.push(`${page}: bare ${attr}="#"`); continue; }
      if (!raw || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw) && !raw.startsWith(syncRoot ?? '\0')) continue;
      checked++;
      const [beforeHash, frag] = raw.split('#');
      const file = beforeHash.split('?')[0];
      let target;
      if (!file) target = abs;
      else if (syncRoot && file.startsWith(syncRoot)) target = path.join(ROOT, file.slice(syncRoot.length));
      else if (file.startsWith('/')) { errors.push(`${page}: root-absolute ${attr}="${raw}"`); continue; }
      else target = path.resolve(path.dirname(abs), file);
      if (!existsSync(target) || statSync(target).isDirectory()) { errors.push(`${page}: ${attr}="${raw}" points at a missing file`); continue; }
      if (frag && target.endsWith('.html') && !idsOf(target).has(frag)) errors.push(`${page}: ${attr}="${raw}" has no element id="${frag}" in ${path.relative(ROOT, target).split(path.sep).join('/')}`);
    }
  }
}

const summary = {};
for (const w of warnings) summary[w] = (summary[w] ?? 0) + 1;
for (const [w, n] of Object.entries(summary)) console.warn(`check-links: warning: ${w}${n > 1 ? ` (x${n})` : ''}`);
for (const e of errors) console.error(`check-links: ${e}`);
if (errors.length) process.exit(1);
console.log(`check-links: ${pages.length} page(s), ${checked} local link(s)/reference(s) checked, ${errors.length} errors, ${warnings.length} warnings`);
