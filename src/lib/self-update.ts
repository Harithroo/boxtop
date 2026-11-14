// Self-update after an FTP deploy (the host has no SSH, and bot protection blocks GitHub's
// runners from calling the site). The deploy uploads the new files, then DEPLOYED_SHA last.
// On each cron tick the running process compares that file with the SHA baked into its own
// bundle at build time. If they differ, new code is on disk: migrate the DB, then exit so
// LiteSpeed/Passenger starts the new build on the next request (Next scans public/ at boot).
import path from "node:path";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

const SHA = /^[0-9a-f]{40}$/;
const RUNNING = process.env.NEXT_PUBLIC_BUILD_SHA ?? "";
let restarting = false;

/** Applies pending ./drizzle migrations. Returns how many were applied. */
export async function runMigrations(): Promise<{ applied: number; total: number }> {
  // Own connection, not the shared pool: one-off, and the .sql files need multipleStatements.
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, multipleStatements: true });
  try {
    const before = await countApplied(conn);
    await migrate(drizzle(conn), { migrationsFolder: path.join(/* turbopackIgnore: true */ process.cwd(), "drizzle") });
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
    deployed = (await readFile(path.join(/* turbopackIgnore: true */ process.cwd(), "DEPLOYED_SHA"), "utf8")).trim();
  } catch {
    deployed = ""; // no marker yet
  }

  // Migrate on every tick, not only when a new build is waiting: after a manual restart the
  // SHAs already match, and pending migrations must still be applied. With nothing pending
  // this is one cheap query.
  let applied = 0;
  try {
    applied = (await runMigrations()).applied;
  } catch (e) {
    // Don't restart onto new code whose schema isn't there; retry next tick.
    return { status: "failed", running: RUNNING, deployed, error: e instanceof Error ? e.message : String(e) };
  }

  if (!SHA.test(deployed) || deployed === RUNNING) return { status: "current", running: RUNNING, applied };

  {
    restarting = true;
    // Let the response flush, then exit; the server starts the new build on the next request.
    setTimeout(() => process.exit(0), 1500);
    return { status: "updating", running: RUNNING, deployed, applied };
  }
}
