import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "@/db/schema";

export function createSqliteTestDb() {
  const sqlite = new Database(":memory:");

  sqlite.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
`);

  const db = drizzle({ client: sqlite, schema });
  migrate(db, { migrationsFolder: "drizzle" });

  return { sqlite, db };
}
