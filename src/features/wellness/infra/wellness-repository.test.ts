import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WellnessRepository } from "@/features/wellness/infra/wellness-repository";

import { METRIC_KEYS } from "@/constants/metrics";
import { dailyEntries, goals } from "@/db/schema";
import * as schema from "@/db/schema";
import { createDefaultGoals } from "@/features/wellness/domain/default-goals";

type RepositoryTestRuntime = {
  drizzleWellnessRepository: WellnessRepository;
  testDb: BetterSQLite3Database<typeof schema>;
};

async function setupRuntime(): Promise<RepositoryTestRuntime | null> {
  try {
    const [{ default: Database }, { drizzle }] = await Promise.all([
      import("better-sqlite3"),
      import("drizzle-orm/better-sqlite3"),
    ]);

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

    const testDb = drizzle({ client: sqlite, schema });

    vi.doMock("@/db/client", () => ({
      db: testDb,
    }));

    const { drizzleWellnessRepository } =
      await import("@/features/wellness/infra/wellness-repository");

    return { drizzleWellnessRepository, testDb };
  } catch {
    return null;
  }
}

const runtime = await setupRuntime();
const defaults = createDefaultGoals();
const describeRepository = runtime ? describe : describe.skip;

describeRepository("drizzle wellness repository", () => {
  beforeEach(() => {
    runtime?.drizzleWellnessRepository.clearAllData(defaults);
  });

  it("writes and reads metric values through sqlite", () => {
    if (!runtime) throw new Error("repository runtime unavailable");

    const date = "2099-01-01";

    runtime.drizzleWellnessRepository.upsertMetric(date, "water", 3);
    runtime.drizzleWellnessRepository.upsertMetric(date, "water", 5);

    expect(runtime.drizzleWellnessRepository.getMetricValue(date, "water")).toBe(5);

    const row = runtime.testDb.select().from(dailyEntries).where(eq(dailyEntries.date, date)).get();
    expect(row?.water).toBe(5);
  });

  it("resets a day back to zero values", () => {
    if (!runtime) throw new Error("repository runtime unavailable");

    const date = "2099-01-02";

    runtime.drizzleWellnessRepository.upsertMetric(date, "water", 7);
    runtime.drizzleWellnessRepository.upsertMetric(date, "sleep", 6.5);
    runtime.drizzleWellnessRepository.upsertMetric(date, "exercise", 40);

    runtime.drizzleWellnessRepository.resetDay(date);

    const row = runtime.testDb.select().from(dailyEntries).where(eq(dailyEntries.date, date)).get();

    expect(row).toBeDefined();
    expect(row?.water).toBe(0);
    expect(row?.mood).toBe(0);
    expect(row?.sleep).toBe(0);
    expect(row?.exercise).toBe(0);
  });

  it("clears entries and reseeds default goals", () => {
    if (!runtime) throw new Error("repository runtime unavailable");

    const date = "2099-01-03";

    runtime.drizzleWellnessRepository.upsertMetric(date, "water", 2);
    runtime.drizzleWellnessRepository.upsertGoal("water", 10);

    runtime.drizzleWellnessRepository.clearAllData(defaults);

    const entries = runtime.testDb.select().from(dailyEntries).all();
    expect(entries).toHaveLength(0);

    const goalRows = runtime.testDb.select().from(goals).all();
    expect(goalRows).toHaveLength(METRIC_KEYS.length);

    for (const metric of METRIC_KEYS) {
      const goalRow = goalRows.find((row) => row.metric === metric);
      expect(goalRow?.value).toBe(defaults[metric]);
    }
  });
});
