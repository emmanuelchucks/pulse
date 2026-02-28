import { maxValue, minValue, number, object, parse, picklist, pipe, string } from "valibot";
import type { MetricKey } from "@/constants/metrics";
import { METRIC_CONFIG, METRIC_KEYS } from "@/constants/metrics";

const metricWriteSchema = object({
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
