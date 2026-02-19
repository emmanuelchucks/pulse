import { describe, expect, it } from "vitest";

import { formatDate, getWeekDates, isToday } from "@/constants/metrics";

describe("metrics date utilities", () => {
  it("formats a local date as yyyy-MM-dd", () => {
    const date = new Date(2026, 1, 10, 23, 59, 59);
    expect(formatDate(date)).toBe("2026-02-10");
  });

  it("returns a Monday-start week", () => {
    const reference = new Date(2026, 1, 11); // Wednesday
    const week = getWeekDates(reference);

    expect(week).toHaveLength(7);

    const monday = week[0];
    const sunday = week[6];

    if (!monday || !sunday) {
      throw new Error("week boundaries missing");
    }

    expect(monday.getDay()).toBe(1);
    expect(formatDate(monday)).toBe("2026-02-09");
    expect(formatDate(sunday)).toBe("2026-02-15");
  });

  it("detects today by local calendar day", () => {
    const today = new Date();
    const sameDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 1);
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 23, 59);

    expect(isToday(sameDay)).toBe(true);
    expect(isToday(yesterday)).toBe(false);
  });
});
