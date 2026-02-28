import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { dailyEntries, goals } from "@/db/schema";
import { createDefaultGoals } from "@/features/wellness/domain/default-goals";
import { createSqliteTestDb } from "@/test/sqlite-test-db";

const runtime = createSqliteTestDb();
const defaults = createDefaultGoals();

function seedDefaultGoals() {
  for (const [metric, value] of Object.entries(defaults)) {
    runtime.db.insert(goals).values({ metric, value, updatedAt: Date.now() }).run();
  }
}

describe("wellness queries (sqlite integration)", () => {
  let useEntryCount: () => number;
  let useCompletionRateInRange: (startDate: string, endDate: string) => number;
  let useTodaySummary: (date: string) => { completedMetrics: number; overallPercent: number };
  let useMetricAveragesInRange: (startDate: string, endDate: string) => {
    water: number;
    mood: number;
    sleep: number;
    exercise: number;
  };

  beforeAll(async () => {
    vi.doMock("drizzle-orm/expo-sqlite", () => ({
      useLiveQuery: (query: { all: () => unknown[] }) => ({ data: query.all() }),
    }));

    vi.doMock("@/db/client", () => ({
      db: runtime.db,
    }));

    vi.doMock("@/store/wellness-query-invalidation", () => ({
      useWellnessQueryVersion: () => 0,
    }));

    const queries = await import("@/store/wellness-queries");
    useEntryCount = queries.useEntryCount;
    useCompletionRateInRange = queries.useCompletionRateInRange;
    useTodaySummary = queries.useTodaySummary;
    useMetricAveragesInRange = queries.useMetricAveragesInRange;
  });

  beforeEach(() => {
    runtime.db.delete(dailyEntries).run();
    runtime.db.delete(goals).run();
    seedDefaultGoals();
  });

  afterAll(() => {
    runtime.sqlite.close();
  });

  it("counts only tracked days with non-zero metrics", () => {
    runtime.db
      .insert(dailyEntries)
      .values([
        { date: "2026-02-10", water: 0, mood: 0, sleep: 0, exercise: 0, updatedAt: Date.now() },
        { date: "2026-02-11", water: 2, mood: 0, sleep: 0, exercise: 0, updatedAt: Date.now() },
      ])
      .run();

    expect(useEntryCount()).toBe(1);
  });

  it("computes completion rate from real sqlite query results", () => {
    runtime.db
      .insert(dailyEntries)
      .values([
        {
          date: "2026-02-10",
          water: 8,
          mood: 5,
          sleep: 8,
          exercise: 30,
          updatedAt: Date.now(),
        },
        {
          date: "2026-02-11",
          water: 4,
          mood: 5,
          sleep: 8,
          exercise: 15,
          updatedAt: Date.now(),
        },
      ])
      .run();

    expect(useCompletionRateInRange("2026-02-10", "2026-02-11")).toBeCloseTo(0.75, 5);
  });

  it("computes today summary using sql metric and percent expressions", () => {
    runtime.db
      .insert(dailyEntries)
      .values({
        date: "2026-02-11",
        water: 4,
        mood: 5,
        sleep: 8,
        exercise: 30,
        updatedAt: Date.now(),
      })
      .run();

    expect(useTodaySummary("2026-02-11")).toEqual({ completedMetrics: 3, overallPercent: 88 });
  });

  it("computes metric averages excluding zero values", () => {
    runtime.db
      .insert(dailyEntries)
      .values([
        {
          date: "2026-02-10",
          water: 2,
          mood: 0,
          sleep: 7,
          exercise: 0,
          updatedAt: Date.now(),
        },
        {
          date: "2026-02-11",
          water: 0,
          mood: 4,
          sleep: 0,
          exercise: 30,
          updatedAt: Date.now(),
        },
        {
          date: "2026-02-12",
          water: 4,
          mood: 0,
          sleep: 9,
          exercise: 0,
          updatedAt: Date.now(),
        },
      ])
      .run();

    expect(useMetricAveragesInRange("2026-02-10", "2026-02-12")).toEqual({
      water: 3,
      mood: 4,
      sleep: 8,
      exercise: 30,
    });
  });

  it("respects query date bounds", () => {
    runtime.db
      .insert(dailyEntries)
      .values([
        {
          date: "2026-02-09",
          water: 8,
          mood: 5,
          sleep: 8,
          exercise: 30,
          updatedAt: Date.now(),
        },
        {
          date: "2026-02-10",
          water: 8,
          mood: 5,
          sleep: 8,
          exercise: 30,
          updatedAt: Date.now(),
        },
      ])
      .run();

    expect(useCompletionRateInRange("2026-02-10", "2026-02-10")).toBe(1);
  });
});
