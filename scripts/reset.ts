// DEVELOPMENT ONLY: drops every table in the database, then runs the migrations.
//   npm run db:reset
import "dotenv/config";

// Show where we're connecting (never the password)
{ const u = new URL(process.env.DATABASE_URL ?? "mysql://missing"); console.log(`Database: ${decodeURIComponent(u.username)} @ ${u.hostname}:${u.port || 3306}/${u.pathname.slice(1)}`); }
import readline from "node:readline/promises";
import mysql from "mysql2/promise";
import { execSync } from "node:child_process";

async function main() {
  const url = new URL(process.env.DATABASE_URL!);
  const dbName = url.pathname.slice(1);
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to reset in production.");
  if (!process.argv.includes("--yes")) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const a = await rl.question(`This deletes ALL data in "${dbName}" on ${url.hostname}. Type the database name to continue: `);
    rl.close();
    if (a.trim() !== dbName) return console.log("Cancelled.");
  }
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL! });
  const [rows] = await conn.query("SHOW TABLES");
  await conn.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const r of rows as Record<string, string>[]) await conn.query(`DROP TABLE \`${Object.values(r)[0]}\``);
  await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  await conn.end();
  console.log(`Dropped ${(rows as unknown[]).length} tables.`);
  execSync("npx tsx scripts/migrate.ts", { stdio: "inherit" });
}
main().catch((e) => { console.error(e); process.exit(1); });
