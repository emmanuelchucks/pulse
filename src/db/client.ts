import { addDatabaseChangeListener, openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "@/db/schema";

export const sqlite = openDatabaseSync("pulse.db", {
  enableChangeListener: true,
});

sqlite.execSync(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS daily_entries (
  date TEXT PRIMARY KEY NOT NULL,
  water REAL NOT NULL DEFAULT 0,
  mood INTEGER NOT NULL DEFAULT 0,
  sleep REAL NOT NULL DEFAULT 0,
  exercise REAL NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);

CREATE TABLE IF NOT EXISTS goals (
  metric TEXT PRIMARY KEY NOT NULL,
  value REAL NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
`);

export const db = drizzle(sqlite, {
  schema,
});

export function onDbChange(listener: () => void) {
  return addDatabaseChangeListener(() => listener());
}
