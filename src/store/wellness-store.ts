import { useSyncExternalStore } from "react";
import { METRIC_CONFIG, METRIC_KEYS, MetricKey, formatDate } from "@/constants/metrics";
import { onDbChange, sqlite } from "@/db/client";
import { parseMetricValue, parseMetricWrite } from "@/db/validation";

export type DailyEntry = {
  date: string;
  water: number;
  mood: number;
  sleep: number;
  exercise: number;
};

export type Goals = Record<MetricKey, number>;

type WellnessState = {
  entries: Record<string, DailyEntry>;
  goals: Goals;
};

const DEFAULT_GOALS: Goals = {
  water: 8,
  mood: 5,
  sleep: 8,
  exercise: 30,
};

let listeners: (() => void)[] = [];
let dbSubscriptionAttached = false;

function createEmptyEntry(dateStr: string): DailyEntry {
  return { date: dateStr, water: 0, mood: 0, sleep: 0, exercise: 0 };
}

function ensureDefaultGoals() {
  sqlite.withTransactionSync(() => {
    for (const metric of METRIC_KEYS) {
      sqlite.runSync(
        `INSERT OR IGNORE INTO goals (metric, value, updated_at) VALUES (?, ?, ?)` ,
        metric,
        DEFAULT_GOALS[metric],
        Date.now()
      );
    }
  });
}

function loadEntries(): Record<string, DailyEntry> {
  const rows = sqlite.getAllSync<DailyEntry>(
    `SELECT date, water, mood, sleep, exercise FROM daily_entries`
  );

  return rows.reduce<Record<string, DailyEntry>>((acc, row) => {
    acc[row.date] = row;
    return acc;
  }, {});
}

function loadGoals(): Goals {
  const rows = sqlite.getAllSync<{ metric: MetricKey; value: number }>(
    `SELECT metric, value FROM goals`
  );

  const goals: Goals = { ...DEFAULT_GOALS };
  for (const row of rows) {
    goals[row.metric] = row.value;
  }

  return goals;
}

function loadState(): WellnessState {
  ensureDefaultGoals();
  return {
    entries: loadEntries(),
    goals: loadGoals(),
  };
}

let state: WellnessState = loadState();

function emit() {
  state = loadState();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];

  if (!dbSubscriptionAttached) {
    onDbChange(() => emit());
    dbSubscriptionAttached = true;
  }

  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): WellnessState {
  return state;
}

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

  emit();
}

export function incrementMetric(dateStr: string, metric: MetricKey) {
  const current = getEntry(state.entries, dateStr)[metric];
  const nextValue = parseMetricValue(metric, current + METRIC_CONFIG[metric].step);
  updateMetric(dateStr, metric, nextValue);
}

export function decrementMetric(dateStr: string, metric: MetricKey) {
  const current = getEntry(state.entries, dateStr)[metric];
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

  emit();
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

  emit();
}

export function clearAllData() {
  sqlite.withTransactionSync(() => {
    sqlite.runSync(`DELETE FROM daily_entries`);
    sqlite.runSync(`DELETE FROM goals`);
  });

  ensureDefaultGoals();
  emit();
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
  return useSyncExternalStore(subscribe, getSnapshot);
}
