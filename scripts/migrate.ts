// Applies the SQL migrations in /drizzle (works on MySQL and MariaDB; no schema introspection).
//   npm run db:migrate
import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

async function main() {
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, multipleStatements: true });
  const [mig] = await conn.query("SHOW TABLES LIKE '__drizzle_migrations'");
  const [boxes] = await conn.query("SHOW TABLES LIKE 'boxes'");
  if ((mig as unknown[]).length === 0 && (boxes as unknown[]).length > 0) {
    console.error("This database was set up with the old `db:push` and has no migration history.\nFor a development database, run `npm run db:reset` (deletes all data) and then `npm run db:seed`.");
    process.exit(1);
  }
  await migrate(drizzle(conn), { migrationsFolder: "./drizzle" });
  console.log("✓ Database is up to date");
  await conn.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
