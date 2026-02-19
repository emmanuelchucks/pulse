import type { MetricKey } from "@/constants/metrics";
import type { dailyEntries, goals } from "@/db/schema";

export type DailyEntryRow = typeof dailyEntries.$inferSelect;
export type DailyEntry = Pick<DailyEntryRow, "date" | "water" | "mood" | "sleep" | "exercise">;

export type GoalRow = typeof goals.$inferSelect;
export type Goals = Record<MetricKey, GoalRow["value"]>;
