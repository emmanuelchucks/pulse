import type { MetricKey } from "@/constants/metrics";
import { db } from "@/db/client";
import { createWellnessService } from "@/features/wellness/application/wellness-service";
import { createDrizzleWellnessRepository } from "@/features/wellness/infra/wellness-repository";
import { bumpWellnessQueryVersion } from "@/store/wellness-query-invalidation";

const wellnessService = createWellnessService(createDrizzleWellnessRepository(db));

export function initializeWellnessData() {
  wellnessService.initializeWellnessData();
  bumpWellnessQueryVersion();
}

function runAction(actionName: string, action: () => void): boolean {
  try {
    action();
    bumpWellnessQueryVersion();
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
