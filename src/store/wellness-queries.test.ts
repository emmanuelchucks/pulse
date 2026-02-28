import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type LiveQueryResult = { data?: unknown[] };

type LiveQueryCall = { query: unknown; deps?: unknown[] };

const liveQueryCalls: LiveQueryCall[] = [];

const useLiveQueryMock = vi.fn<(query: unknown, deps?: unknown[]) => LiveQueryResult>(
  (query, deps) => {
    liveQueryCalls.push({ query, deps });
    return { data: [] };
  },
);

vi.mock("drizzle-orm/expo-sqlite", () => ({
  useLiveQuery: useLiveQueryMock,
}));

vi.mock("@/store/wellness-query-invalidation", () => ({
  useWellnessQueryVersion: () => 0,
}));

function makeBuilder() {
  const builder: {
    from: () => typeof builder;
    where: () => typeof builder;
    limit: () => typeof builder;
  } = {
    from: () => builder,
    where: () => builder,
    limit: () => builder,
  };

  return builder;
}

vi.mock("@/db/client", () => ({
  db: {
    select: () => makeBuilder(),
  },
}));

let useGoals: () => {
  water: number;
  mood: number;
  sleep: number;
  exercise: number;
};
let useEntryCount: () => number;
let useEntryByDate: (date: string) => {
  date: string;
  water: number;
  mood: number;
  sleep: number;
  exercise: number;
};
let useEntriesInRange: (startDate: string, endDate: string) => unknown[];
let useCompletionRateInRange: (startDate: string, endDate: string) => number;
let useTodaySummary: (date: string) => { completedMetrics: number; overallPercent: number };
let useMetricAveragesInRange: (startDate: string, endDate: string) => {
  water: number;
  mood: number;
  sleep: number;
  exercise: number;
};

describe("wellness store query hooks", () => {
  beforeAll(async () => {
    const queries = await import("@/store/wellness-queries");
    useGoals = queries.useGoals;
    useEntryCount = queries.useEntryCount;
    useEntryByDate = queries.useEntryByDate;
    useEntriesInRange = queries.useEntriesInRange;
    useCompletionRateInRange = queries.useCompletionRateInRange;
    useTodaySummary = queries.useTodaySummary;
    useMetricAveragesInRange = queries.useMetricAveragesInRange;
  });
  beforeEach(() => {
    useLiveQueryMock.mockClear();
    useLiveQueryMock.mockImplementation((query, deps) => {
      liveQueryCalls.push({ query, deps });
      return { data: [] };
    });
    liveQueryCalls.length = 0;
  });

  it("returns default goals when table is empty", () => {
    useLiveQueryMock.mockReturnValue({ data: [] });

    expect(useGoals()).toEqual({ water: 8, mood: 5, sleep: 8, exercise: 30 });
  });

  it("counts only days with at least one non-zero metric", () => {
    useLiveQueryMock.mockReturnValue({
      data: [
        { water: 0, mood: 0, sleep: 0, exercise: 0 },
        { water: 1, mood: 0, sleep: 0, exercise: 0 },
        { water: 0, mood: 0, sleep: 0.5, exercise: 0 },
      ],
    });

    expect(useEntryCount()).toBe(2);
  });

  it("returns zero tracked-day count when query has no rows", () => {
    useLiveQueryMock.mockReturnValue({ data: [] });

    expect(useEntryCount()).toBe(0);
  });

  it("returns a date entry from DB row shape", () => {
    useLiveQueryMock.mockReturnValue({
      data: [{ date: "2026-02-11", water: 3, mood: 4, sleep: 7.5, exercise: 25 }],
    });

    const entry = useEntryByDate("2026-02-11");

    expect(entry).toEqual({ date: "2026-02-11", water: 3, mood: 4, sleep: 7.5, exercise: 25 });
  });

  it("returns a zeroed entry fallback when row is missing", () => {
    useLiveQueryMock.mockReturnValue({ data: [] });

    const entry = useEntryByDate("2026-02-12");

    expect(entry).toEqual({ date: "2026-02-12", water: 0, mood: 0, sleep: 0, exercise: 0 });
  });

  it("computes completion rate using DB-computed completed metrics", () => {
    useLiveQueryMock.mockReturnValue({ data: [{ completedMetrics: "6" }] });

    const rate = useCompletionRateInRange("2026-02-10", "2026-02-11");

    expect(rate).toBeCloseTo(0.75, 5);
  });

  it("returns zero completion rate for invalid ranges", () => {
    useLiveQueryMock.mockReturnValue({ data: [{ completedMetrics: "6" }] });

    const rate = useCompletionRateInRange("2026-02-11", "2026-02-10");

    expect(rate).toBe(0);
  });

  it("normalizes today summary metrics from DB", () => {
    useLiveQueryMock.mockReturnValue({ data: [{ completedMetrics: "3", overallPercent: "88" }] });

    const summary = useTodaySummary("2026-02-11");

    expect(summary).toEqual({ completedMetrics: 3, overallPercent: 88 });
  });

  it("returns zeroed today summary when no row exists", () => {
    useLiveQueryMock.mockReturnValue({ data: [] });

    const summary = useTodaySummary("2026-02-11");

    expect(summary).toEqual({ completedMetrics: 0, overallPercent: 0 });
  });

  it("normalizes metric averages from DB to numeric values", () => {
    useLiveQueryMock.mockReturnValue({
      data: [{ water: "2.5", mood: "4", sleep: "7.25", exercise: "35" }],
    });

    const averages = useMetricAveragesInRange("2026-02-10", "2026-02-16");

    expect(averages).toEqual({ water: 2.5, mood: 4, sleep: 7.25, exercise: 35 });
  });

  it("returns zeroed averages when DB query has no row", () => {
    useLiveQueryMock.mockReturnValue({ data: [] });

    const averages = useMetricAveragesInRange("2026-02-10", "2026-02-16");

    expect(averages).toEqual({ water: 0, mood: 0, sleep: 0, exercise: 0 });
  });

  it("subscribes goals query with invalidation deps", () => {
    useGoals();

    const call = liveQueryCalls.at(-1);
    expect(call?.deps).toEqual([0]);
  });

  it("subscribes tracked-day query with invalidation deps", () => {
    useEntryCount();

    const call = liveQueryCalls.at(-1);
    expect(call?.deps).toEqual([0]);
  });

  it("subscribes entry-by-date query with date and invalidation deps", () => {
    useEntryByDate("2026-02-11");

    const call = liveQueryCalls.at(-1);
    expect(call?.deps).toEqual(["2026-02-11", 0]);
  });

  it("subscribes range query with bounds and invalidation deps", () => {
    useEntriesInRange("2026-02-10", "2026-02-16");

    const call = liveQueryCalls.at(-1);
    expect(call?.deps).toEqual(["2026-02-10", "2026-02-16", 0]);
  });

  it("subscribes completion-rate query with range and invalidation deps", () => {
    useCompletionRateInRange("2026-02-10", "2026-02-16");

    const call = liveQueryCalls.at(-1);
    expect(call?.deps).toEqual(["2026-02-10", "2026-02-16", 0]);
  });

  it("subscribes today summary query with date and invalidation deps", () => {
    useTodaySummary("2026-02-11");

    const call = liveQueryCalls.at(-1);
    expect(call?.deps).toEqual(["2026-02-11", 0]);
  });

  it("subscribes metric-averages query with range and invalidation deps", () => {
    useMetricAveragesInRange("2026-02-10", "2026-02-16");

    const call = liveQueryCalls.at(-1);
    expect(call?.deps).toEqual(["2026-02-10", "2026-02-16", 0]);
  });
});
