import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { env } from "@/lib/env";
import * as schema from "./schema";

const databaseUrl = env.DATABASE_URL;

if (databaseUrl !== ":memory:") {
  const resolved = path.resolve(databaseUrl);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
}

const sqlite = new Database(databaseUrl);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { sqlite };
