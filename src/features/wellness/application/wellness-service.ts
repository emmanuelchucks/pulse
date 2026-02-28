import type { MetricKey } from "@/constants/metrics";
import type { WellnessRepository } from "@/features/wellness/infra/wellness-repository";
import { METRIC_CONFIG } from "@/constants/metrics";
import { parseMetricValue, parseMetricWrite } from "@/db/validation";
import { createDefaultGoals } from "@/features/wellness/domain/default-goals";

interface WellnessService {
  initializeWellnessData(): void;
  updateMetric(date: string, metric: MetricKey, value: number): void;
  incrementMetric(date: string, metric: MetricKey): void;
  decrementMetric(date: string, metric: MetricKey): void;
  updateGoal(metric: MetricKey, value: number): void;
  resetDay(date: string): void;
  clearAllData(): void;
}

function clampMetricValue(metric: MetricKey, value: number): number {
  const config = METRIC_CONFIG[metric];
  return Math.min(config.max, Math.max(config.min, value));
}

export function createWellnessService(repository: WellnessRepository): WellnessService {
  const defaultGoals = createDefaultGoals();
  let initialized = false;

  return {
    initializeWellnessData() {
      if (initialized) return;
      repository.seedGoals(defaultGoals);
      initialized = true;
    },

    updateMetric(date, metric, value) {
      const clamped = clampMetricValue(metric, value);
      const parsed = parseMetricWrite(date, metric, clamped);
      repository.upsertMetric(parsed.date, parsed.metric, parsed.value);
    },

    incrementMetric(date, metric) {
      const current = repository.getMetricValue(date, metric);
      const nextValue = clampMetricValue(metric, current + METRIC_CONFIG[metric].step);
      this.updateMetric(date, metric, nextValue);
    },

    decrementMetric(date, metric) {
      const current = repository.getMetricValue(date, metric);
      const nextValue = clampMetricValue(metric, current - METRIC_CONFIG[metric].step);
      this.updateMetric(date, metric, nextValue);
    },

    updateGoal(metric, value) {
      const nextValue = clampMetricValue(metric, value);
      repository.upsertGoal(metric, parseMetricValue(metric, nextValue));
    },

    resetDay(date) {
      repository.resetDay(date);
    },

    clearAllData() {
      repository.clearAllData(defaultGoals);
      initialized = true;
    },
  };
}
