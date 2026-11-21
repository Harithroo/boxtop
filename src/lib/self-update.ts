// Self-update after an FTP deploy (the host has no SSH, and bot protection blocks GitHub's
// runners from calling the site). The deploy uploads the new build to its own release folder,
// then app/DEPLOYED_SHA last (see scripts/deploy-launcher.cjs for the layout). On each cron tick
// the running process compares that file with the SHA baked into its own bundle at build time.
// If they differ, the new release is complete on disk: apply ITS migrations, then exit so
// LiteSpeed/Passenger runs the launcher on the next request, which starts the new release.
import path from "node:path";
import { access, readdir, readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

const SHA = /^[0-9a-f]{40}$/;
const RUNNING = process.env.NEXT_PUBLIC_BUILD_SHA ?? "";
let restarting = false;

// Set by the launcher. Without it (a local build, or a process started before the release layout)
// the marker and the migrations sit in the working directory, as they used to.
const MARKER = process.env.BOXTOP_DEPLOY_MARKER || path.join(/* turbopackIgnore: true */ process.cwd(), "DEPLOYED_SHA");
const RELEASES = process.env.BOXTOP_RELEASES_DIR || "";

/** The folder of release `sha` (releases/nm-<hash>/<sha>), or null if it isn't on disk. */
async function releaseDir(sha: string): Promise<string | null> {
  if (!RELEASES) return null;
  let groups: string[] = [];
  try {
    groups = await readdir(RELEASES);
  } catch {
    return null;
  }
  for (const nm of groups) {
    const dir = path.join(/* turbopackIgnore: true */ RELEASES, nm, sha);
    try {
      await access(path.join(/* turbopackIgnore: true */ dir, "server.js"));
      return dir;
    } catch {}
  }
  return null;
}

/** Applies pending migrations from `dir`/drizzle (default: ./drizzle). Returns how many were applied. */
export async function runMigrations(dir = process.cwd()): Promise<{ applied: number; total: number }> {
  // Own connection, not the shared pool: one-off, and the .sql files need multipleStatements.
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, multipleStatements: true });
  try {
    const before = await countApplied(conn);
    await migrate(drizzle(conn), { migrationsFolder: path.join(/* turbopackIgnore: true */ dir, "drizzle") });
    const after = await countApplied(conn);
    return { applied: after - before, total: after };
  } finally {
    await conn.end();
  }
}

async function countApplied(conn: mysql.Connection): Promise<number> {
  try {
    const [rows] = await conn.query("SELECT COUNT(*) AS n FROM __drizzle_migrations");
    return Number((rows as { n: number }[])[0].n);
  } catch {
    return 0; // table doesn't exist yet on a fresh database
  }
}

export type UpdateCheck =
  | { status: "not-deployed-build" | "restarting"; running: string }
  | { status: "current"; running: string; applied: number }
  | { status: "updating"; running: string; deployed: string; applied: number }
  | { status: "failed"; running: string; deployed: string; error: string };

/** Call from the cron route. Never throws. */
export async function applyPendingDeploy(): Promise<UpdateCheck> {
  if (restarting) return { status: "restarting", running: RUNNING };
  // Only CI builds carry a real SHA; local/dev builds never self-restart (no loop possible).
  if (!SHA.test(RUNNING)) return { status: "not-deployed-build", running: RUNNING };

  let deployed = "";
  try {
    deployed = (await readFile(MARKER, "utf8")).trim();
  } catch {
    deployed = ""; // no marker yet
  }
  const waiting = SHA.test(deployed) && deployed !== RUNNING;

  // The launcher can only start a release that is on disk. A marker naming one that isn't (a typo
  // in a hand-made rollback) must not take the site down: keep running and report it.
  let next: string | null = null;
  if (waiting && RELEASES) {
    next = await releaseDir(deployed);
    if (!next) return { status: "failed", running: RUNNING, deployed, error: `release ${deployed} not found under ${RELEASES}` };
  }

  // Migrate on every tick, not only when a new build is waiting: after a manual restart the
  // SHAs already match, and pending migrations must still be applied. With nothing pending
  // this is one cheap query. When a new release is waiting, its migrations are the ones to apply
  // (they are complete on disk: the marker is uploaded after the whole release).
  let applied = 0;
  try {
    applied = (await runMigrations(next ?? undefined)).applied;
  } catch (e) {
    // Don't restart onto new code whose schema isn't there; retry next tick.
    return { status: "failed", running: RUNNING, deployed, error: e instanceof Error ? e.message : String(e) };
  }

  if (!waiting) return { status: "current", running: RUNNING, applied };

  {
    restarting = true;
    // Let the response flush, then exit; the server starts the new build on the next request.
    setTimeout(() => process.exit(0), 1500);
    return { status: "updating", running: RUNNING, deployed, applied };
  }
}
