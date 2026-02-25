import type { MetricKey } from "@/constants/metrics";
import type { DailyEntry, Goals } from "@/db/types";
import { METRIC_KEYS, formatDate } from "@/constants/metrics";

export function createEmptyEntry(dateStr: string): DailyEntry {
  return { date: dateStr, water: 0, mood: 0, sleep: 0, exercise: 0 };
}

export function toEntriesMap(rows: DailyEntry[]): Record<string, DailyEntry> {
  return rows.reduce<Record<string, DailyEntry>>((accumulator, row) => {
    accumulator[row.date] = row;
    return accumulator;
  }, {});
}

export function getEntry(entries: Record<string, DailyEntry>, dateStr: string): DailyEntry {
  return entries[dateStr] ?? createEmptyEntry(dateStr);
}

export function getProgress(
  entries: Record<string, DailyEntry>,
  goals: Goals,
  params: { dateStr: string; metric: MetricKey },
): number {
  const entry = getEntry(entries, params.dateStr);
  const goal = goals[params.metric];
  if (goal === 0) return 0;
  return Math.min(entry[params.metric] / goal, 1);
}

export function getStreak(
  entries: Record<string, DailyEntry>,
  goals: Goals,
  params: { metric: MetricKey; today?: Date },
): number {
  let streak = 0;
  const today = params.today ?? new Date();
  const cursor = new Date(today);

  while (true) {
    const dateStr = formatDate(cursor);
    const entry = entries[dateStr];
    if (!entry || entry[params.metric] === 0) break;
    if (entry[params.metric] / goals[params.metric] < 1) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getWeeklyAverage(
  entries: Record<string, DailyEntry>,
  metric: MetricKey,
  referenceDate: Date,
): number {
  let total = 0;
  let count = 0;
  const cursor = new Date(referenceDate);

  for (let i = 0; i < 7; i++) {
    const dateStr = formatDate(cursor);
    const entry = entries[dateStr];
    if (entry && entry[metric] > 0) {
      total += entry[metric];
      count++;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return count > 0 ? total / count : 0;
}

export function getCompletionRate(
  entries: Record<string, DailyEntry>,
  goals: Goals,
  params?: { days?: number; today?: Date },
): number {
  const days = params?.days ?? 7;
  const today = params?.today ?? new Date();

  let completedMetrics = 0;
  const totalMetrics = days * METRIC_KEYS.length;

  for (let i = 0; i < days; i++) {
    const cursor = new Date(today);
    cursor.setDate(today.getDate() - i);
    const dateStr = formatDate(cursor);
    const entry = entries[dateStr];
    if (!entry) continue;

    for (const key of METRIC_KEYS) {
      if (entry[key] > 0 && entry[key] >= goals[key]) {
        completedMetrics++;
      }
    }
  }

  return totalMetrics > 0 ? completedMetrics / totalMetrics : 0;
}
