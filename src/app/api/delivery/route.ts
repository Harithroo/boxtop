import { NextResponse, type NextRequest } from "next/server";
import { getCalendar } from "@/lib/delivery";

// GET /api/delivery?zoneId=1&lead=0&sameDay=1 -> available dates and slots
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const zoneId = Number(sp.get("zoneId"));
  if (!zoneId) return NextResponse.json({ days: [] });
  const days = await getCalendar({ zoneId, leadDays: Number(sp.get("lead") ?? 0), sameDayOk: sp.get("sameDay") !== "0" });
  return NextResponse.json({ days }, { headers: { "Cache-Control": "no-store" } });
}
