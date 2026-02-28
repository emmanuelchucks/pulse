import { and, eq, gte, lte, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import type { MetricKey } from "@/constants/metrics";
import type { DailyEntry, Goals } from "@/db/types";
import { METRIC_KEYS } from "@/constants/metrics";
import { db } from "@/db/client";
import { dailyEntries, goals as goalsTable } from "@/db/schema";
import { createDefaultGoals } from "@/features/wellness/domain/default-goals";
import { useWellnessQueryVersion } from "@/store/wellness-query-invalidation";

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

type TodaySummary = {
  completedMetrics: number;
  overallPercent: number;
};

function isMetricKey(value: string): value is MetricKey {
  return METRIC_KEYS.some((metric) => metric === value);
}

function getInclusiveDayCount(startDate: string, endDate: string): number {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (!isValid(start) || !isValid(end)) {
    return 0;
  }

  const dayDiff = differenceInCalendarDays(end, start);
  if (dayDiff < 0) {
    return 0;
  }

  return dayDiff + 1;
}

export function useGoals() {
  const version = useWellnessQueryVersion();
  const goalsQuery = useLiveQuery(db.select().from(goalsTable), [version]);
  const base: Goals = { ...DEFAULT_GOALS };

  for (const row of goalsQuery.data ?? []) {
    if (!isMetricKey(row.metric)) continue;
    base[row.metric] = row.value;
  }

  return base;
}

export function useEntryCount() {
  const version = useWellnessQueryVersion();
  const query = useLiveQuery(
    db.select({
      water: dailyEntries.water,
      mood: dailyEntries.mood,
      sleep: dailyEntries.sleep,
      exercise: dailyEntries.exercise,
    }).from(dailyEntries),
    [version],
  );

  const rows = query.data ?? [];

  return rows.filter((row) => row.water > 0 || row.mood > 0 || row.sleep > 0 || row.exercise > 0)
    .length;
}

export function useEntryByDate(date: string): DailyEntry {
  const version = useWellnessQueryVersion();
  const query = useLiveQuery(
    db.select().from(dailyEntries).where(eq(dailyEntries.date, date)).limit(1),
    [date, version],
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
  const version = useWellnessQueryVersion();
  const query = useLiveQuery(
    db
      .select()
      .from(dailyEntries)
      .where(and(gte(dailyEntries.date, startDate), lte(dailyEntries.date, endDate))),
    [startDate, endDate, version],
  );

  return query.data ?? [];
}

export function useCompletionRateInRange(startDate: string, endDate: string): number {
  const version = useWellnessQueryVersion();
  const dayCount = getInclusiveDayCount(startDate, endDate);

  const query = useLiveQuery(
    db
      .select({
        completedMetrics: sql<number>`coalesce(sum(${COMPLETED_METRICS_SQL}), 0)`,
      })
      .from(dailyEntries)
      .where(and(gte(dailyEntries.date, startDate), lte(dailyEntries.date, endDate))),
    [startDate, endDate, version],
  );

  if (dayCount === 0) return 0;

  const completedMetrics = Number(query.data?.[0]?.completedMetrics ?? 0);
  const totalMetrics = dayCount * METRIC_KEYS.length;

  return totalMetrics > 0 ? completedMetrics / totalMetrics : 0;
}

export function useTodaySummary(date: string): TodaySummary {
  const version = useWellnessQueryVersion();
  const query = useLiveQuery(
    db
      .select({
        completedMetrics: COMPLETED_METRICS_SQL,
        overallPercent: OVERALL_PERCENT_SQL,
      })
      .from(dailyEntries)
      .where(eq(dailyEntries.date, date))
      .limit(1),
    [date, version],
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
  const version = useWellnessQueryVersion();
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
    [startDate, endDate, version],
  );

  const row = query.data?.[0];

  return {
    water: Number(row?.water ?? 0),
    mood: Number(row?.mood ?? 0),
    sleep: Number(row?.sleep ?? 0),
    exercise: Number(row?.exercise ?? 0),
  };
}
