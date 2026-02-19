import { describe, expect, it } from "vitest";

import type { DailyEntry, Goals } from "@/db/types";

import { formatDate } from "@/constants/metrics";
import {
  createEmptyEntry,
  getCompletionRate,
  getEntry,
  getProgress,
  getStreak,
  getWeeklyAverage,
} from "@/features/wellness/domain/analytics";

const goals: Goals = {
  water: 8,
  mood: 5,
  sleep: 8,
  exercise: 30,
};

function withEntry(date: Date, partial: Partial<DailyEntry>): DailyEntry {
  return {
    ...createEmptyEntry(formatDate(date)),
    ...partial,
    date: formatDate(date),
  };
}

describe("wellness analytics", () => {
  it("returns empty entry fallback when date is missing", () => {
    const result = getEntry({}, "2026-02-11");
    expect(result).toEqual(createEmptyEntry("2026-02-11"));
  });

  it("caps progress at 100%", () => {
    const date = "2026-02-11";
    const entries: Record<string, DailyEntry> = {
      [date]: {
        date,
        water: 12,
        mood: 5,
        sleep: 9,
        exercise: 40,
      },
    };

    expect(getProgress(entries, goals, { dateStr: date, metric: "water" })).toBe(1);
  });

  it("calculates streak only for consecutive completed days", () => {
    const today = new Date(2026, 1, 11);
    const yesterday = new Date(2026, 1, 10);
    const twoDaysAgo = new Date(2026, 1, 9);

    const entries: Record<string, DailyEntry> = {
      [formatDate(today)]: withEntry(today, { water: 8 }),
      [formatDate(yesterday)]: withEntry(yesterday, { water: 10 }),
      [formatDate(twoDaysAgo)]: withEntry(twoDaysAgo, { water: 3 }),
    };

    expect(getStreak(entries, goals, { metric: "water", today })).toBe(2);
  });

  it("computes weekly average from non-zero values only", () => {
    const reference = new Date(2026, 1, 11);
    const entries: Record<string, DailyEntry> = {
      [formatDate(reference)]: withEntry(reference, { exercise: 30 }),
      [formatDate(new Date(2026, 1, 10))]: withEntry(new Date(2026, 1, 10), { exercise: 0 }),
      [formatDate(new Date(2026, 1, 9))]: withEntry(new Date(2026, 1, 9), { exercise: 60 }),
    };

    expect(getWeeklyAverage(entries, "exercise", reference)).toBe(45);
  });

  it("calculates completion rate by metric count", () => {
    const today = new Date(2026, 1, 11);
    const yesterday = new Date(2026, 1, 10);

    const entries: Record<string, DailyEntry> = {
      [formatDate(today)]: {
        date: formatDate(today),
        water: 8,
        mood: 5,
        sleep: 8,
        exercise: 30,
      },
      [formatDate(yesterday)]: {
        date: formatDate(yesterday),
        water: 4,
        mood: 5,
        sleep: 8,
        exercise: 15,
      },
    };

    // 6 completed metrics out of 8 total metrics across 2 days.
    expect(getCompletionRate(entries, goals, { days: 2, today })).toBeCloseTo(0.75, 5);
  });
});
