import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import type { MetricKey } from "@/constants/metrics";
import type { DailyEntry, Goals } from "@/db/types";

import { METRIC_KEYS } from "@/constants/metrics";
import { db } from "@/db/client";
import { dailyEntries, goals as goalsTable } from "@/db/schema";
import { createWellnessService } from "@/features/wellness/application/wellness-service";
import { createDefaultGoals } from "@/features/wellness/domain/default-goals";
import { createDrizzleWellnessRepository } from "@/features/wellness/infra/wellness-repository";

const wellnessService = createWellnessService(createDrizzleWellnessRepository(db));
const DEFAULT_GOALS = createDefaultGoals();

function isMetricKey(value: string): value is MetricKey {
  return METRIC_KEYS.some((metric) => metric === value);
}

export function initializeWellnessData() {
  wellnessService.initializeWellnessData();
}

export function updateMetric(date: string, metric: MetricKey, value: number) {
  wellnessService.updateMetric(date, metric, value);
}

export function incrementMetric(date: string, metric: MetricKey) {
  wellnessService.incrementMetric(date, metric);
}

export function decrementMetric(date: string, metric: MetricKey) {
  wellnessService.decrementMetric(date, metric);
}

export function updateGoal(metric: MetricKey, value: number) {
  wellnessService.updateGoal(metric, value);
}

export function resetDay(date: string) {
  wellnessService.resetDay(date);
}

export function clearAllData() {
  wellnessService.clearAllData();
}

export function useWellnessStore() {
  const entriesQuery = useLiveQuery(db.select().from(dailyEntries));
  const goalsQuery = useLiveQuery(db.select().from(goalsTable));

  const rows = entriesQuery.data ?? [];
  const entries = rows.reduce<Record<string, DailyEntry>>((accumulator, row) => {
    accumulator[row.date] = {
      date: row.date,
      water: row.water,
      mood: row.mood,
      sleep: row.sleep,
      exercise: row.exercise,
    };
    return accumulator;
  }, {});

  const base: Goals = { ...DEFAULT_GOALS };
  const goalRows = goalsQuery.data ?? [];

  for (const row of goalRows) {
    if (!isMetricKey(row.metric)) continue;
    base[row.metric] = row.value;
  }

  return { entries, goals: base };
}
