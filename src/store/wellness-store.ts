import { useMemo } from "react";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { METRIC_CONFIG, METRIC_KEYS, MetricKey, formatDate } from "@/constants/metrics";
import { db, sqlite } from "@/db/client";
import { dailyEntries, goals as goalsTable } from "@/db/schema";
import { parseMetricValue, parseMetricWrite } from "@/db/validation";

export type DailyEntry = {
  date: string;
  water: number;
  mood: number;
  sleep: number;
  exercise: number;
};

export type Goals = Record<MetricKey, number>;

const DEFAULT_GOALS: Goals = {
  water: 8,
  mood: 5,
  sleep: 8,
  exercise: 30,
};

function createEmptyEntry(dateStr: string): DailyEntry {
  return { date: dateStr, water: 0, mood: 0, sleep: 0, exercise: 0 };
}

function ensureDefaultGoals() {
  sqlite.withTransactionSync(() => {
    for (const metric of METRIC_KEYS) {
      sqlite.runSync(
        `INSERT OR IGNORE INTO goals (metric, value, updated_at) VALUES (?, ?, ?)`,
        metric,
        DEFAULT_GOALS[metric],
        Date.now()
      );
    }
  });
}

ensureDefaultGoals();

function ensureEntry(dateStr: string) {
  sqlite.runSync(
    `INSERT OR IGNORE INTO daily_entries (date, water, mood, sleep, exercise, updated_at)
     VALUES (?, 0, 0, 0, 0, ?)`,
    dateStr,
    Date.now()
  );
}

export function updateMetric(dateStr: string, metric: MetricKey, value: number) {
  const parsed = parseMetricWrite(dateStr, metric, value);

  ensureEntry(parsed.date);
  sqlite.runSync(
    `UPDATE daily_entries SET ${parsed.metric} = ?, updated_at = ? WHERE date = ?`,
    parsed.value,
    Date.now(),
    parsed.date
  );
}

function getMetricValueSync(dateStr: string, metric: MetricKey): number {
  const row = sqlite.getFirstSync<{ value: number }>(
    `SELECT ${metric} as value FROM daily_entries WHERE date = ?`,
    dateStr
  );
  return row?.value ?? 0;
}

export function incrementMetric(dateStr: string, metric: MetricKey) {
  const current = getMetricValueSync(dateStr, metric);
  const nextValue = parseMetricValue(metric, current + METRIC_CONFIG[metric].step);
  updateMetric(dateStr, metric, nextValue);
}

export function decrementMetric(dateStr: string, metric: MetricKey) {
  const current = getMetricValueSync(dateStr, metric);
  const nextValue = parseMetricValue(metric, current - METRIC_CONFIG[metric].step);
  updateMetric(dateStr, metric, nextValue);
}

export function updateGoal(metric: MetricKey, value: number) {
  sqlite.runSync(
    `INSERT INTO goals (metric, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(metric) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    metric,
    parseMetricValue(metric, value),
    Date.now()
  );
}

export function resetDay(dateStr: string) {
  sqlite.runSync(
    `INSERT INTO daily_entries (date, water, mood, sleep, exercise, updated_at)
     VALUES (?, 0, 0, 0, 0, ?)
     ON CONFLICT(date) DO UPDATE SET
      water = 0,
      mood = 0,
      sleep = 0,
      exercise = 0,
      updated_at = excluded.updated_at`,
    dateStr,
    Date.now()
  );
}

export function clearAllData() {
  sqlite.withTransactionSync(() => {
    sqlite.runSync(`DELETE FROM daily_entries`);
    sqlite.runSync(`DELETE FROM goals`);
  });

  ensureDefaultGoals();
}

export function getEntry(
  entries: Record<string, DailyEntry>,
  dateStr: string
): DailyEntry {
  return entries[dateStr] ?? createEmptyEntry(dateStr);
}

export function getProgress(
  entries: Record<string, DailyEntry>,
  goals: Goals,
  dateStr: string,
  metric: MetricKey
): number {
  const entry = getEntry(entries, dateStr);
  const goal = goals[metric];
  if (goal === 0) return 0;
  return Math.min(entry[metric] / goal, 1);
}

export function getStreak(
  entries: Record<string, DailyEntry>,
  goals: Goals,
  metric: MetricKey
): number {
  const today = new Date();
  let streak = 0;
  const d = new Date(today);

  while (true) {
    const dateStr = formatDate(d);
    const entry = entries[dateStr];
    if (!entry || entry[metric] === 0) break;
    if (entry[metric] / goals[metric] < 1) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return streak;
}

export function getWeeklyAverage(
  entries: Record<string, DailyEntry>,
  metric: MetricKey,
  referenceDate: Date
): number {
  let total = 0;
  let count = 0;
  const d = new Date(referenceDate);
  for (let i = 0; i < 7; i++) {
    const dateStr = formatDate(d);
    const entry = entries[dateStr];
    if (entry && entry[metric] > 0) {
      total += entry[metric];
      count++;
    }
    d.setDate(d.getDate() - 1);
  }
  return count > 0 ? total / count : 0;
}

export function getCompletionRate(
  entries: Record<string, DailyEntry>,
  goals: Goals,
  days: number = 7
): number {
  const today = new Date();
  let completedMetrics = 0;
  const totalMetrics = days * METRIC_KEYS.length;

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDate(d);
    const entry = entries[dateStr];
    if (entry) {
      for (const key of METRIC_KEYS) {
        if (entry[key] > 0 && entry[key] >= goals[key]) {
          completedMetrics++;
        }
      }
    }
  }

  return totalMetrics > 0 ? completedMetrics / totalMetrics : 0;
}

export function useWellnessStore() {
  const entriesQuery = useLiveQuery(db.select().from(dailyEntries));
  const goalsQuery = useLiveQuery(db.select().from(goalsTable));

  const entries = useMemo(() => {
    const rows = entriesQuery.data ?? [];
    return rows.reduce<Record<string, DailyEntry>>((acc, row) => {
      acc[row.date] = {
        date: row.date,
        water: row.water,
        mood: row.mood,
        sleep: row.sleep,
        exercise: row.exercise,
      };
      return acc;
    }, {});
  }, [entriesQuery.data]);

  const goals = useMemo(() => {
    const base: Goals = { ...DEFAULT_GOALS };
    const rows = goalsQuery.data ?? [];
    for (const row of rows) {
      const metric = row.metric as MetricKey;
      if (metric in base) base[metric] = row.value;
    }
    return base;
  }, [goalsQuery.data]);

  return { entries, goals };
}
