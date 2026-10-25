#!/usr/bin/env node
// Injects shared partials into every page listed in tools/shell-map.json.
// Usage: node tools/sync-shell.mjs [--check]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MARKERS, VARIANTS, markerRe } from './shell-variants.mjs';

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TOOLS, '..');
const check = process.argv.includes('--check');

const readJson = (f) => JSON.parse(readFileSync(path.join(TOOLS, f), 'utf8'));
const lf = (s) => s.replace(/\r\n/g, '\n');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const shellMap = readJson('shell-map.json');
const seo = readJson('seo.json');

const partialCache = new Map();
function partial(name) {
  if (!partialCache.has(name)) {
    const f = path.join(TOOLS, 'partials', `${name}.html`);
    if (!existsSync(f)) throw new Error(`missing partial file tools/partials/${name}.html`);
    // Partial files may carry their own outer markers (sprite.html does); strip them, the page owns the markers.
    const body = lf(readFileSync(f, 'utf8'))
      .replace(/^\s*<!-- partial: [\w-]+ -->\n?/, '')
      .replace(/\n?<!-- \/partial: [\w-]+ -->\s*$/, '')
      .trimEnd();
    partialCache.set(name, body);
  }
  return partialCache.get(name);
}

const hashCache = new Map();
function fileHash(abs) {
  if (!hashCache.has(abs)) {
    hashCache.set(abs, existsSync(abs) ? createHash('sha1').update(readFileSync(abs)).digest('hex').slice(0, 8) : null);
  }
  return hashCache.get(abs);
}

function build(pagePath, variantName) {
  const abs = path.join(ROOT, pagePath);
  const variant = VARIANTS[variantName];
  if (!variant) throw new Error(`${pagePath}: unknown variant "${variantName}"`);
  const entry = seo.pages?.[pagePath];
  if (!entry) throw new Error(`${pagePath}: no entry in tools/seo.json`);

  let html = lf(readFileSync(abs, 'utf8'));
  const syncRoot = html.match(/<!-- sync-root: (\S+) -->/)?.[1];
  const root = syncRoot ?? ((path.relative(path.dirname(abs), ROOT).split(path.sep).join('/') || '.') + '/');
  const noindex = seo.staging === true || entry.noindex === true || variantName === 'none';
  const vars = { root, title: esc(entry.title ?? ''), description: esc(entry.description ?? ''), robots: noindex ? 'noindex,nofollow' : 'index,follow' };

  for (const name of MARKERS) {
    const src = variant[name];
    const re = markerRe(name);
    if (!re.test(html)) {
      if (src) throw new Error(`${pagePath}: missing <!-- partial: ${name} --> markers`);
      continue;
    }
    const body = src ? partial(src).replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m)) : '';
    html = html.replace(re, () => `<!-- partial: ${name} -->\n${body ? body + '\n' : ''}<!-- /partial: ${name} -->`);
  }

  // ?v=<first 8 hex of sha1> on every local css/js reference; files that don't exist yet stay unversioned
  html = html.replace(/(href|src)="([^"#]+?\.(?:css|js))(?:\?v=[0-9a-f]+)?"/g, (m, attr, url) => {
    if (/^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith('data:')) return m;
    let target;
    if (syncRoot && url.startsWith(syncRoot)) target = path.join(ROOT, url.slice(syncRoot.length));
    else if (url.startsWith('/')) return m;
    else target = path.resolve(path.dirname(abs), url);
    const h = fileHash(target);
    return h ? `${attr}="${url}?v=${h}"` : `${attr}="${url}"`;
  });
  return { abs, html };
}

const pages = Object.entries(shellMap.pages ?? {});
const stale = [];
let failed = false;
for (const [pagePath, variantName] of pages) {
  try {
    const { abs, html } = build(pagePath, variantName);
    if (lf(readFileSync(abs, 'utf8')) !== html) {
      stale.push(pagePath);
      if (!check) writeFileSync(abs, html);
    }
  } catch (e) {
    failed = true;
    console.error(`ERROR ${e.message}`);
  }
}

if (check) {
  for (const p of stale) console.log(`out of date: ${p}`);
  let shellOk = true;
  try { execFileSync(process.execPath, [path.join(TOOLS, 'check-shell.mjs')], { stdio: 'inherit' }); } catch { shellOk = false; }
  if (failed || stale.length || !shellOk) process.exit(1);
  console.log(`sync-shell --check: ${pages.length} page(s) up to date`);
} else {
  for (const p of stale) console.log(`updated: ${p}`);
  console.log(`sync-shell: ${stale.length} updated, ${pages.length - stale.length} unchanged`);
  if (failed) process.exit(1);
}
