import { useMemo } from "react";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { METRIC_CONFIG, METRIC_KEYS, MetricKey, formatDate } from "@/constants/metrics";
import { db } from "@/db/client";
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

const METRIC_COLUMN = {
  water: dailyEntries.water,
  mood: dailyEntries.mood,
  sleep: dailyEntries.sleep,
  exercise: dailyEntries.exercise,
} as const;

let initialized = false;

export function initializeWellnessData() {
  if (initialized) return;

  for (const metric of METRIC_KEYS) {
    db.insert(goalsTable)
      .values({
        metric,
        value: DEFAULT_GOALS[metric],
        updatedAt: Date.now(),
      })
      .onConflictDoNothing({ target: goalsTable.metric })
      .run();
  }

  initialized = true;
}

function createEmptyEntry(dateStr: string): DailyEntry {
  return { date: dateStr, water: 0, mood: 0, sleep: 0, exercise: 0 };
}

function ensureEntry(dateStr: string) {
  db.insert(dailyEntries)
    .values({
      date: dateStr,
      water: 0,
      mood: 0,
      sleep: 0,
      exercise: 0,
      updatedAt: Date.now(),
    })
    .onConflictDoNothing({ target: dailyEntries.date })
    .run();
}

export function updateMetric(dateStr: string, metric: MetricKey, value: number) {
  const parsed = parseMetricWrite(dateStr, metric, value);
  const updatedAt = Date.now();

  ensureEntry(parsed.date);

  db.update(dailyEntries)
    .set(
      metric === "water"
        ? { water: parsed.value, updatedAt }
        : metric === "mood"
          ? { mood: parsed.value, updatedAt }
          : metric === "sleep"
            ? { sleep: parsed.value, updatedAt }
            : { exercise: parsed.value, updatedAt }
    )
    .where(eq(dailyEntries.date, parsed.date))
    .run();
}

function getMetricValue(dateStr: string, metric: MetricKey): number {
  const row = db
    .select({ value: METRIC_COLUMN[metric] })
    .from(dailyEntries)
    .where(eq(dailyEntries.date, dateStr))
    .get();

  return row?.value ?? 0;
}

export function incrementMetric(dateStr: string, metric: MetricKey) {
  const current = getMetricValue(dateStr, metric);
  const nextValue = parseMetricValue(metric, current + METRIC_CONFIG[metric].step);
  updateMetric(dateStr, metric, nextValue);
}

export function decrementMetric(dateStr: string, metric: MetricKey) {
  const current = getMetricValue(dateStr, metric);
  const nextValue = parseMetricValue(metric, current - METRIC_CONFIG[metric].step);
  updateMetric(dateStr, metric, nextValue);
}

export function updateGoal(metric: MetricKey, value: number) {
  db.insert(goalsTable)
    .values({
      metric,
      value: parseMetricValue(metric, value),
      updatedAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: goalsTable.metric,
      set: {
        value: parseMetricValue(metric, value),
        updatedAt: Date.now(),
      },
    })
    .run();
}

export function resetDay(dateStr: string) {
  db.insert(dailyEntries)
    .values({
      date: dateStr,
      water: 0,
      mood: 0,
      sleep: 0,
      exercise: 0,
      updatedAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: dailyEntries.date,
      set: {
        water: 0,
        mood: 0,
        sleep: 0,
        exercise: 0,
        updatedAt: Date.now(),
      },
    })
    .run();
}

export function clearAllData() {
  db.delete(dailyEntries).run();
  db.delete(goalsTable).run();
  initialized = false;
  initializeWellnessData();
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
