import { NextResponse, type NextRequest } from "next/server";
import { runJobs } from "@/lib/notify";
import { runDaily } from "@/lib/daily";

// cPanel cron, every minute:
//   curl -s "https://box-top.lk/api/cron?key=YOUR_CRON_SECRET" > /dev/null
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.nextUrl.searchParams.get("key") !== process.env.CRON_SECRET) return new NextResponse(null, { status: 404 });
  const daily = await runDaily();
  return NextResponse.json({ daily, jobs: await runJobs() });
}
