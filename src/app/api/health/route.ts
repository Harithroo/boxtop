// GET /api/health — which build is running. NEXT_PUBLIC_BUILD_SHA is inlined at build time
// (set in deploy.yml), so this answers from the running process, not from files on disk:
// the deploy smoke test uses it to prove Passenger restarted onto the new code.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ build: process.env.NEXT_PUBLIC_BUILD_SHA ?? "dev" }, { headers: { "Cache-Control": "no-store" } });
}
