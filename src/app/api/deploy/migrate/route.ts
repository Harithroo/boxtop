// POST /api/deploy/migrate — manual fallback: applies pending SQL migrations from ./drizzle.
// Deploys normally migrate themselves via the cron (src/lib/self-update.ts).
// Guarded by DEPLOY_TOKEN (cPanel env var). Wrong/missing token → 404, like /api/cron.
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runMigrations } from "@/lib/self-update";

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
  try {
    return NextResponse.json({ ok: true, ...(await runMigrations()) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
