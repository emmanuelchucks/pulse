import { eq } from "drizzle-orm";

import type { MetricKey } from "@/constants/metrics";
import type { Goals } from "@/db/types";

import { db } from "@/db/client";
import { dailyEntries, goals } from "@/db/schema";

const METRIC_COLUMN = {
  water: dailyEntries.water,
  mood: dailyEntries.mood,
  sleep: dailyEntries.sleep,
  exercise: dailyEntries.exercise,
} as const;

function metricUpdateSet(metric: MetricKey, value: number, updatedAt: number) {
  if (metric === "water") return { water: value, updatedAt };
  if (metric === "mood") return { mood: value, updatedAt };
  if (metric === "sleep") return { sleep: value, updatedAt };
  return { exercise: value, updatedAt };
}

export interface WellnessRepository {
  seedGoals(defaultGoals: Goals): void;
  upsertMetric(date: string, metric: MetricKey, value: number): void;
  getMetricValue(date: string, metric: MetricKey): number;
  upsertGoal(metric: MetricKey, value: number): void;
  resetDay(date: string): void;
  clearAllData(defaultGoals: Goals): void;
}

export const drizzleWellnessRepository: WellnessRepository = {
  seedGoals(defaultGoals) {
    db.transaction((tx) => {
      for (const [metric, value] of Object.entries(defaultGoals) as [MetricKey, number][]) {
        tx.insert(goals)
          .values({
            metric,
            value,
            updatedAt: Date.now(),
          })
          .onConflictDoNothing({ target: goals.metric })
          .run();
      }
    });
  },

  upsertMetric(date, metric, value) {
    const updatedAt = Date.now();

    db.transaction((tx) => {
      tx.insert(dailyEntries)
        .values({
          date,
          water: 0,
          mood: 0,
          sleep: 0,
          exercise: 0,
          updatedAt,
        })
        .onConflictDoNothing({ target: dailyEntries.date })
        .run();

      tx.update(dailyEntries)
        .set(metricUpdateSet(metric, value, updatedAt))
        .where(eq(dailyEntries.date, date))
        .run();
    });
  },

  getMetricValue(date, metric) {
    const row = db
      .select({ value: METRIC_COLUMN[metric] })
      .from(dailyEntries)
      .where(eq(dailyEntries.date, date))
      .get();

    return row?.value ?? 0;
  },

  upsertGoal(metric, value) {
    db.insert(goals)
      .values({
        metric,
        value,
        updatedAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: goals.metric,
        set: {
          value,
          updatedAt: Date.now(),
        },
      })
      .run();
  },

  resetDay(date) {
    db.transaction((tx) => {
      tx.insert(dailyEntries)
        .values({
          date,
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
    });
  },

  clearAllData(defaultGoals) {
    db.transaction((tx) => {
      tx.delete(dailyEntries).run();
      tx.delete(goals).run();

      for (const [metric, value] of Object.entries(defaultGoals) as [MetricKey, number][]) {
        tx.insert(goals)
          .values({
            metric,
            value,
            updatedAt: Date.now(),
          })
          .run();
      }
    });
  },
};
