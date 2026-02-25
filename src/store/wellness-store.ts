import { and, count, eq, gte, lte, sql } from "drizzle-orm";
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

const WATER_GOAL_SQL = sql<number>`coalesce((select ${goalsTable.value} from ${goalsTable} where ${goalsTable.metric} = 'water' limit 1), ${DEFAULT_GOALS.water})`;
const MOOD_GOAL_SQL = sql<number>`coalesce((select ${goalsTable.value} from ${goalsTable} where ${goalsTable.metric} = 'mood' limit 1), ${DEFAULT_GOALS.mood})`;
const SLEEP_GOAL_SQL = sql<number>`coalesce((select ${goalsTable.value} from ${goalsTable} where ${goalsTable.metric} = 'sleep' limit 1), ${DEFAULT_GOALS.sleep})`;
const EXERCISE_GOAL_SQL = sql<number>`coalesce((select ${goalsTable.value} from ${goalsTable} where ${goalsTable.metric} = 'exercise' limit 1), ${DEFAULT_GOALS.exercise})`;

const COMPLETED_METRICS_SQL = sql<number>`
  (
    case when ${dailyEntries.water} > 0 and ${dailyEntries.water} >= ${WATER_GOAL_SQL} then 1 else 0 end +
    case when ${dailyEntries.mood} > 0 and ${dailyEntries.mood} >= ${MOOD_GOAL_SQL} then 1 else 0 end +
    case when ${dailyEntries.sleep} > 0 and ${dailyEntries.sleep} >= ${SLEEP_GOAL_SQL} then 1 else 0 end +
    case when ${dailyEntries.exercise} > 0 and ${dailyEntries.exercise} >= ${EXERCISE_GOAL_SQL} then 1 else 0 end
  )
`;

const OVERALL_PERCENT_SQL = sql<number>`
  round(
    (
      (
        case when ${WATER_GOAL_SQL} > 0 then min(${dailyEntries.water} / ${WATER_GOAL_SQL}, 1) else 0 end +
        case when ${MOOD_GOAL_SQL} > 0 then min(${dailyEntries.mood} / ${MOOD_GOAL_SQL}, 1) else 0 end +
        case when ${SLEEP_GOAL_SQL} > 0 then min(${dailyEntries.sleep} / ${SLEEP_GOAL_SQL}, 1) else 0 end +
        case when ${EXERCISE_GOAL_SQL} > 0 then min(${dailyEntries.exercise} / ${EXERCISE_GOAL_SQL}, 1) else 0 end
      ) / ${METRIC_KEYS.length}
    ) * 100
  )
`;

export type TodaySummary = {
  completedMetrics: number;
  overallPercent: number;
};

function isMetricKey(value: string): value is MetricKey {
  return METRIC_KEYS.some((metric) => metric === value);
}

function parseDateToEpochDay(dateStr: string): number | null {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function getInclusiveDayCount(startDate: string, endDate: string): number {
  const startDay = parseDateToEpochDay(startDate);
  const endDay = parseDateToEpochDay(endDate);

  if (startDay === null || endDay === null || endDay < startDay) {
    return 0;
  }

  return endDay - startDay + 1;
}

export function initializeWellnessData() {
  wellnessService.initializeWellnessData();
}

function runAction(actionName: string, action: () => void): boolean {
  try {
    action();
    return true;
  } catch (error) {
    globalThis.console.error(`Wellness action failed: ${actionName}`, error);
    return false;
  }
}

export function updateMetric(date: string, metric: MetricKey, value: number) {
  return runAction("updateMetric", () => {
    wellnessService.updateMetric(date, metric, value);
  });
}

export function incrementMetric(date: string, metric: MetricKey) {
  return runAction("incrementMetric", () => {
    wellnessService.incrementMetric(date, metric);
  });
}

export function decrementMetric(date: string, metric: MetricKey) {
  return runAction("decrementMetric", () => {
    wellnessService.decrementMetric(date, metric);
  });
}

export function updateGoal(metric: MetricKey, value: number) {
  return runAction("updateGoal", () => {
    wellnessService.updateGoal(metric, value);
  });
}

export function resetDay(date: string) {
  return runAction("resetDay", () => {
    wellnessService.resetDay(date);
  });
}

export function clearAllData() {
  return runAction("clearAllData", () => {
    wellnessService.clearAllData();
  });
}

export function useGoals() {
  const goalsQuery = useLiveQuery(db.select().from(goalsTable));
  const base: Goals = { ...DEFAULT_GOALS };

  for (const row of goalsQuery.data ?? []) {
    if (!isMetricKey(row.metric)) continue;
    base[row.metric] = row.value;
  }

  return base;
}

export function useEntryCount() {
  const query = useLiveQuery(db.select({ total: count() }).from(dailyEntries));
  return query.data?.[0]?.total ?? 0;
}

export function useEntryByDate(date: string): DailyEntry {
  const query = useLiveQuery(
    db.select().from(dailyEntries).where(eq(dailyEntries.date, date)).limit(1),
  );
  const row = query.data?.[0];

  return {
    date,
    water: row?.water ?? 0,
    mood: row?.mood ?? 0,
    sleep: row?.sleep ?? 0,
    exercise: row?.exercise ?? 0,
  };
}

export function useEntriesInRange(startDate: string, endDate: string) {
  const query = useLiveQuery(
    db
      .select()
      .from(dailyEntries)
      .where(and(gte(dailyEntries.date, startDate), lte(dailyEntries.date, endDate))),
  );

  return query.data ?? [];
}

export function useCompletionRateInRange(startDate: string, endDate: string): number {
  const dayCount = getInclusiveDayCount(startDate, endDate);

  const query = useLiveQuery(
    db
      .select({
        completedMetrics: sql<number>`coalesce(sum(${COMPLETED_METRICS_SQL}), 0)`,
      })
      .from(dailyEntries)
      .where(and(gte(dailyEntries.date, startDate), lte(dailyEntries.date, endDate))),
  );

  if (dayCount === 0) return 0;

  const completedMetrics = Number(query.data?.[0]?.completedMetrics ?? 0);
  const totalMetrics = dayCount * METRIC_KEYS.length;

  return totalMetrics > 0 ? completedMetrics / totalMetrics : 0;
}

export function useTodaySummary(date: string): TodaySummary {
  const query = useLiveQuery(
    db
      .select({
        completedMetrics: COMPLETED_METRICS_SQL,
        overallPercent: OVERALL_PERCENT_SQL,
      })
      .from(dailyEntries)
      .where(eq(dailyEntries.date, date))
      .limit(1),
  );

  return {
    completedMetrics: Number(query.data?.[0]?.completedMetrics ?? 0),
    overallPercent: Number(query.data?.[0]?.overallPercent ?? 0),
  };
}

export function useMetricAveragesInRange(
  startDate: string,
  endDate: string,
): Record<MetricKey, number> {
  const query = useLiveQuery(
    db
      .select({
        water: sql<number>`coalesce(avg(nullif(${dailyEntries.water}, 0)), 0)`,
        mood: sql<number>`coalesce(avg(nullif(${dailyEntries.mood}, 0)), 0)`,
        sleep: sql<number>`coalesce(avg(nullif(${dailyEntries.sleep}, 0)), 0)`,
        exercise: sql<number>`coalesce(avg(nullif(${dailyEntries.exercise}, 0)), 0)`,
      })
      .from(dailyEntries)
      .where(and(gte(dailyEntries.date, startDate), lte(dailyEntries.date, endDate))),
  );

  const row = query.data?.[0];

  return {
    water: Number(row?.water ?? 0),
    mood: Number(row?.mood ?? 0),
    sleep: Number(row?.sleep ?? 0),
    exercise: Number(row?.exercise ?? 0),
  };
}
