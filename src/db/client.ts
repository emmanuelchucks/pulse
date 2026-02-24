import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { addDatabaseChangeListener, openDatabaseSync } from "expo-sqlite";
import migrations from "@/db/migrations";
import { relations } from "@/db/relations";
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
  relations,
});

let migrationPromise: Promise<void> | null = null;

export function runMigrations() {
  if (!migrationPromise) {
    migrationPromise = Promise.resolve(migrate(db, migrations))
      .then(() => undefined)
      .catch((error) => {
        migrationPromise = null;
        throw error;
      });
  }

  return migrationPromise;
}

export function onDbChange(listener: () => void) {
  return addDatabaseChangeListener(() => listener());
}

export type AppDatabase = typeof db;
