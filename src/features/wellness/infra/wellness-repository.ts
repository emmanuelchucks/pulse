import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import type { MetricKey } from "@/constants/metrics";
import type { AppDatabase } from "@/db/client";
import type * as schema from "@/db/schema";
import type { Goals } from "@/db/types";
import { METRIC_KEYS } from "@/constants/metrics";
import { dailyEntries, goals } from "@/db/schema";

type WellnessDatabase = AppDatabase | BetterSQLite3Database<typeof schema>;

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

export function createDrizzleWellnessRepository(database: WellnessDatabase): WellnessRepository {
  return {
    seedGoals(defaultGoals) {
      database.transaction((tx) => {
        for (const metric of METRIC_KEYS) {
          tx.insert(goals)
            .values({
              metric,
              value: defaultGoals[metric],
              updatedAt: Date.now(),
            })
            .onConflictDoNothing({ target: goals.metric })
            .run();
        }
      });
    },

    upsertMetric(date, metric, value) {
      const updatedAt = Date.now();

      database.transaction((tx) => {
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
      const row = database.select().from(dailyEntries).where(eq(dailyEntries.date, date)).get();
      const value = row?.[metric];
      return typeof value === "number" ? value : 0;
    },

    upsertGoal(metric, value) {
      database
        .insert(goals)
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
      database.transaction((tx) => {
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
      database.transaction((tx) => {
        tx.delete(dailyEntries).run();
        tx.delete(goals).run();

        for (const metric of METRIC_KEYS) {
          tx.insert(goals)
            .values({
              metric,
              value: defaultGoals[metric],
              updatedAt: Date.now(),
            })
            .run();
        }
      });
    },
  };
}
