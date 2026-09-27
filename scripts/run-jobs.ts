// Alternative to the HTTP cron: `npm run cron` (drains the notification queue once).
import "dotenv/config";
import { runJobs } from "../src/lib/notify";

runJobs().then((r) => { console.log(r); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
