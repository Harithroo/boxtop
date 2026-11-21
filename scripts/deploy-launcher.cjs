// The cPanel startup file. deploy.yml uploads this as app/server.js; it is not part of the Next build.
//
// Every deploy goes to its own folder, releases/nm-<deps hash>/<commit sha>/, and nothing is ever
// uploaded over the files of the build that is running. (Uploading over it was what took the site
// down during deploys: for minutes the running server loaded a mix of old and new chunks.)
// app/DEPLOYED_SHA, uploaded last, names the release that should run. This file starts that release.
// The running process restarts itself when the marker changes: see src/lib/self-update.ts.
//
// Layout on the server (FTP root = /home/harithroo/boxtop):
//   app/server.js              this launcher
//   app/DEPLOYED_SHA           the commit to run
//   releases/nm-<hash>/node_modules        shared by every release whose dependencies hash to <hash>;
//   releases/nm-<hash>/<sha>/server.js ... Node finds it by walking up from the release folder
//
// Plain CommonJS, Node built-ins only: it runs before anything else and must not depend on the build.
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS on purpose, see above */
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const MARKER = path.join(__dirname, "DEPLOYED_SHA");
const RELEASES = path.join(__dirname, "..", "releases");
const SHA = /^[0-9a-f]{40}$/;
const NM = /^nm-[0-9a-f]{16}$/;
const HOUR = 3600e3;

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// A deploy rewrites the marker in place; a start that lands mid-write sees it empty. Retry briefly.
function deployedSha() {
  for (let i = 0; i < 30; i++) {
    try {
      const sha = fs.readFileSync(MARKER, "utf8").trim();
      if (SHA.test(sha)) return sha;
    } catch {}
    sleep(100);
  }
  throw new Error(`[launcher] ${MARKER} is missing or is not a commit SHA`);
}

/** Every release folder on disk, newest first. */
function releases() {
  const out = [];
  let groups = [];
  try {
    groups = fs.readdirSync(RELEASES).filter((n) => NM.test(n));
  } catch {
    return out;
  }
  for (const nm of groups) {
    for (const sha of fs.readdirSync(path.join(RELEASES, nm)).filter((n) => SHA.test(n))) {
      const dir = path.join(RELEASES, nm, sha);
      out.push({ sha, nm, dir, mtime: fs.statSync(dir).mtimeMs });
    }
  }
  return out.sort((a, b) => b.mtime - a.mtime);
}

// Pages already open in a browser keep asking for the previous build's /_next/static files (hashed
// names, so they never clash). Copy across the ones under a week old, keeping their timestamps so they
// age out after a week instead of piling up. Done before Next starts, which lists static files at boot.
function carryStatic(from, to, cutoff) {
  let entries;
  try {
    entries = fs.readdirSync(from, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const src = path.join(from, e.name);
    const dest = path.join(to, e.name);
    if (e.isDirectory()) {
      carryStatic(src, dest, cutoff);
      continue;
    }
    if (!e.isFile() || fs.existsSync(dest)) continue;
    const st = fs.statSync(src);
    if (st.mtimeMs < cutoff) continue;
    fs.mkdirSync(to, { recursive: true });
    fs.copyFileSync(src, dest);
    fs.utimesSync(dest, st.atime, st.mtime);
  }
}

// Keep the running release, the two before it (instant rollback, and a still-running old process if
// there is one), and anything touched in the last hour (a deploy that is uploading right now).
function prune(current) {
  const now = Date.now();
  const all = releases();
  const keep = new Set([current.dir, ...all.filter((r) => r.dir !== current.dir).slice(0, 2).map((r) => r.dir)]);
  for (const r of all) {
    if (keep.has(r.dir) || now - r.mtime < HOUR) continue;
    fs.rmSync(r.dir, { recursive: true, force: true });
    console.log(`[launcher] removed old release ${r.nm}/${r.sha}`);
  }
  // A node_modules group with no releases left, a day after its last release went.
  for (const nm of fs.readdirSync(RELEASES).filter((n) => NM.test(n))) {
    const dir = path.join(RELEASES, nm);
    if (nm === current.nm || fs.readdirSync(dir).some((n) => SHA.test(n))) continue;
    if (now - fs.statSync(dir).mtimeMs < 24 * HOUR) continue;
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`[launcher] removed unused ${nm}`);
  }
}

const sha = deployedSha();
const all = releases();
const current = all.find((r) => r.sha === sha && fs.existsSync(path.join(r.dir, "server.js")));
if (!current) throw new Error(`[launcher] app/DEPLOYED_SHA says ${sha}, but releases/*/${sha}/server.js does not exist`);

try {
  const previous = all.find((r) => r.dir !== current.dir && r.mtime <= current.mtime);
  // First start after switching to this layout: the previous build still lives in app/ itself.
  const from = previous ? path.join(previous.dir, ".next", "static") : path.join(__dirname, ".next", "static");
  carryStatic(from, path.join(current.dir, ".next", "static"), Date.now() - 7 * 24 * HOUR);
} catch (e) {
  console.error("[launcher] could not copy the previous build's static files:", e);
}

// Read by src/lib/self-update.ts to find the marker and the next release's migrations.
process.env.BOXTOP_DEPLOY_MARKER = MARKER;
process.env.BOXTOP_RELEASES_DIR = RELEASES;
console.log(`[launcher] starting ${current.nm}/${current.sha}`);
require(path.join(current.dir, "server.js"));

setTimeout(() => {
  try {
    prune(current);
  } catch (e) {
    console.error("[launcher] pruning old releases failed:", e);
  }
}, 60e3).unref();
