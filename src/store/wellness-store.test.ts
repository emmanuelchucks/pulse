import { beforeEach, describe, expect, it, vi } from "vitest";

type LiveQueryResult = { data?: unknown[] };

const useLiveQueryMock = vi.fn<(query: unknown) => LiveQueryResult>();

vi.mock("drizzle-orm/expo-sqlite", () => ({
  useLiveQuery: useLiveQueryMock,
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

describe("wellness store query hooks", () => {
  beforeEach(() => {
    useLiveQueryMock.mockReset();
  });

  it("returns a date entry from DB row shape", async () => {
    useLiveQueryMock.mockReturnValue({
      data: [{ date: "2026-02-11", water: 3, mood: 4, sleep: 7.5, exercise: 25 }],
    });

    const { useEntryByDate } = await import("@/store/wellness-store");
    const entry = useEntryByDate("2026-02-11");

    expect(entry).toEqual({ date: "2026-02-11", water: 3, mood: 4, sleep: 7.5, exercise: 25 });
  });

  it("returns a zeroed entry fallback when row is missing", async () => {
    useLiveQueryMock.mockReturnValue({ data: [] });

    const { useEntryByDate } = await import("@/store/wellness-store");
    const entry = useEntryByDate("2026-02-12");

    expect(entry).toEqual({ date: "2026-02-12", water: 0, mood: 0, sleep: 0, exercise: 0 });
  });

  it("computes completion rate using DB-computed completed metrics", async () => {
    useLiveQueryMock.mockReturnValue({ data: [{ completedMetrics: "6" }] });

    const { useCompletionRateInRange } = await import("@/store/wellness-store");
    const rate = useCompletionRateInRange("2026-02-10", "2026-02-11");

    expect(rate).toBeCloseTo(0.75, 5);
  });

  it("returns zero completion rate for invalid ranges", async () => {
    useLiveQueryMock.mockReturnValue({ data: [{ completedMetrics: "6" }] });

    const { useCompletionRateInRange } = await import("@/store/wellness-store");
    const rate = useCompletionRateInRange("2026-02-11", "2026-02-10");

    expect(rate).toBe(0);
  });

  it("normalizes today summary metrics from DB", async () => {
    useLiveQueryMock.mockReturnValue({ data: [{ completedMetrics: "3", overallPercent: "88" }] });

    const { useTodaySummary } = await import("@/store/wellness-store");
    const summary = useTodaySummary("2026-02-11");

    expect(summary).toEqual({ completedMetrics: 3, overallPercent: 88 });
  });

  it("returns zeroed today summary when no row exists", async () => {
    useLiveQueryMock.mockReturnValue({ data: [] });

    const { useTodaySummary } = await import("@/store/wellness-store");
    const summary = useTodaySummary("2026-02-11");

    expect(summary).toEqual({ completedMetrics: 0, overallPercent: 0 });
  });

  it("normalizes metric averages from DB to numeric values", async () => {
    useLiveQueryMock.mockReturnValue({
      data: [{ water: "2.5", mood: "4", sleep: "7.25", exercise: "35" }],
    });

    const { useMetricAveragesInRange } = await import("@/store/wellness-store");
    const averages = useMetricAveragesInRange("2026-02-10", "2026-02-16");

    expect(averages).toEqual({ water: 2.5, mood: 4, sleep: 7.25, exercise: 35 });
  });

  it("returns zeroed averages when DB query has no row", async () => {
    useLiveQueryMock.mockReturnValue({ data: [] });

    const { useMetricAveragesInRange } = await import("@/store/wellness-store");
    const averages = useMetricAveragesInRange("2026-02-10", "2026-02-16");

    expect(averages).toEqual({ water: 0, mood: 0, sleep: 0, exercise: 0 });
  });
});
