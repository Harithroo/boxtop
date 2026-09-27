import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Reuse one pool across hot reloads in dev. Shared hosting allows few connections: keep the pool small.
const g = globalThis as unknown as { _pool?: mysql.Pool };
const pool = g._pool ?? mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 5, dateStrings: ["DATE"] });
if (process.env.NODE_ENV !== "production") g._pool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
export { schema };
