// POST /api/deploy/migrate — applies pending SQL migrations from ./drizzle on the server.
// Called by GitHub Actions right after the FTP upload: the host has no SSH, so the app migrates itself.
// Guarded by DEPLOY_TOKEN (cPanel env var + GitHub secret). Wrong/missing token → 404, like /api/cron.
import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { timingSafeEqual } from "node:crypto";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

export const dynamic = "force-dynamic";

function authorised(req: NextRequest): boolean {
  const expected = process.env.DEPLOY_TOKEN ?? "";
  const given = req.headers.get("x-deploy-token") ?? "";
  if (expected.length < 16) return false; // unset or too weak → route is off
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!authorised(req)) return new NextResponse(null, { status: 404 });

  // Own single connection, not the shared pool: migrations are one-off and need multipleStatements.
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, multipleStatements: true });
  try {
    const before = await applied(conn);
    await migrate(drizzle(conn), { migrationsFolder: path.join(/* turbopackIgnore: true */ process.cwd(), "drizzle") });
    const after = await applied(conn);
    return NextResponse.json({ ok: true, applied: after - before, total: after });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  } finally {
    await conn.end();
  }
}

async function applied(conn: mysql.Connection): Promise<number> {
  try {
    const [rows] = await conn.query("SELECT COUNT(*) AS n FROM __drizzle_migrations");
    return Number((rows as { n: number }[])[0].n);
  } catch {
    return 0; // table doesn't exist yet on a fresh database
  }
}
