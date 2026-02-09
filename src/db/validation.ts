import { createInsertSchema, createUpdateSchema } from "drizzle-orm/valibot";
import {
  maxValue,
  minValue,
  number,
  object,
  parse,
  picklist,
  pipe,
  string,
} from "valibot";
import { METRIC_CONFIG, METRIC_KEYS, MetricKey } from "@/constants/metrics";
import { dailyEntries, goals } from "@/db/schema";

export const insertDailyEntrySchema = createInsertSchema(dailyEntries);
export const updateGoalSchema = createUpdateSchema(goals);

export const metricWriteSchema = object({
  date: string(),
  metric: picklist(METRIC_KEYS),
  value: number(),
});

export function parseMetricValue(metric: MetricKey, value: number): number {
  const config = METRIC_CONFIG[metric];
  return parse(pipe(number(), minValue(config.min), maxValue(config.max)), value);
}

export function parseMetricWrite(date: string, metric: MetricKey, value: number) {
  return parse(metricWriteSchema, { date, metric, value: parseMetricValue(metric, value) });
}
