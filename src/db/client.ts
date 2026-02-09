import { addDatabaseChangeListener, openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "@/db/migrations";
import * as schema from "@/db/schema";

export const sqlite = openDatabaseSync("pulse.db", {
  enableChangeListener: true,
});

sqlite.execSync(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
`);

export const db = drizzle(sqlite, {
  schema,
});

let migrationPromise: Promise<void> | null = null;

export function runMigrations() {
  if (!migrationPromise) {
    migrationPromise = Promise.resolve(migrate(db, migrations as any)).then(() => undefined);
  }

  return migrationPromise;
}

export function onDbChange(listener: () => void) {
  return addDatabaseChangeListener(() => listener());
}
