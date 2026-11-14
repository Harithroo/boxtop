import { NextResponse, type NextRequest } from "next/server";
import { runJobs } from "@/lib/notify";
import { runDaily } from "@/lib/daily";
import { applyPendingDeploy } from "@/lib/self-update";

// cPanel cron, every minute:
//   curl -s "https://box-top.lk/api/cron?key=YOUR_CRON_SECRET" > /dev/null
// Also applies a fresh FTP deploy (migrate + restart), see src/lib/self-update.ts.
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.nextUrl.searchParams.get("key") !== process.env.CRON_SECRET) return new NextResponse(null, { status: 404 });
  const deploy = await applyPendingDeploy();
  // About to restart onto new code: leave the jobs to the new process next minute.
  if (deploy.status === "updating" || deploy.status === "restarting") return NextResponse.json({ deploy });
  const daily = await runDaily();
  return NextResponse.json({ deploy, daily, jobs: await runJobs() });
}
