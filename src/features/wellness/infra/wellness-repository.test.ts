import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { METRIC_KEYS } from "@/constants/metrics";
import { dailyEntries, goals } from "@/db/schema";
import { createDefaultGoals } from "@/features/wellness/domain/default-goals";
import { createDrizzleWellnessRepository } from "@/features/wellness/infra/wellness-repository";
import { createSqliteTestDb } from "@/test/sqlite-test-db";

const defaults = createDefaultGoals();
const runtime = createSqliteTestDb();
const repository = createDrizzleWellnessRepository(runtime.db);

describe("drizzle wellness repository", () => {
  beforeEach(() => {
    repository.clearAllData(defaults);
  });

  afterAll(() => {
    runtime.sqlite.close();
  });

  it("writes and reads metric values through sqlite", () => {
    const date = "2099-01-01";

    repository.upsertMetric(date, "water", 3);
    repository.upsertMetric(date, "water", 5);

    expect(repository.getMetricValue(date, "water")).toBe(5);

    const row = runtime.db.select().from(dailyEntries).where(eq(dailyEntries.date, date)).get();
    expect(row?.water).toBe(5);
  });

  it("resets a day back to zero values", () => {
    const date = "2099-01-02";

    repository.upsertMetric(date, "water", 7);
    repository.upsertMetric(date, "sleep", 6.5);
    repository.upsertMetric(date, "exercise", 40);

    repository.resetDay(date);

    const row = runtime.db.select().from(dailyEntries).where(eq(dailyEntries.date, date)).get();

    expect(row).toBeDefined();
    expect(row?.water).toBe(0);
    expect(row?.mood).toBe(0);
    expect(row?.sleep).toBe(0);
    expect(row?.exercise).toBe(0);
  });

  it("clears entries and reseeds default goals", () => {
    const date = "2099-01-03";

    repository.upsertMetric(date, "water", 2);
    repository.upsertGoal("water", 10);

    repository.clearAllData(defaults);

    const entries = runtime.db.select().from(dailyEntries).all();
    expect(entries).toHaveLength(0);

    const goalRows = runtime.db.select().from(goals).all();
    expect(goalRows).toHaveLength(METRIC_KEYS.length);

    for (const metric of METRIC_KEYS) {
      const goalRow = goalRows.find((row) => row.metric === metric);
      expect(goalRow?.value).toBe(defaults[metric]);
    }
  });
});
