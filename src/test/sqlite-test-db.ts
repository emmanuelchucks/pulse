import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "@/db/schema";

export function createSqliteTestDb() {
  const sqlite = new Database(":memory:");

  sqlite.exec(`
CREATE TABLE daily_entries (
  id text PRIMARY KEY,
  date text NOT NULL,
  water real DEFAULT 0 NOT NULL,
  mood integer DEFAULT 0 NOT NULL,
  sleep real DEFAULT 0 NOT NULL,
  exercise real DEFAULT 0 NOT NULL,
  created_at integer NOT NULL,
  updated_at integer NOT NULL
);
CREATE UNIQUE INDEX daily_entries_date_unique ON daily_entries (date);

CREATE TABLE goals (
  id text PRIMARY KEY,
  metric text NOT NULL,
  value real NOT NULL,
  created_at integer NOT NULL,
  updated_at integer NOT NULL
);
CREATE UNIQUE INDEX goals_metric_unique ON goals (metric);
`);

  const db = drizzle({ client: sqlite, schema });

  return { sqlite, db };
}
