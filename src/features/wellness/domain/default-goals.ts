import type { Goals } from "@/db/types";

import { METRIC_CONFIG } from "@/constants/metrics";

export function createDefaultGoals(): Goals {
  return {
    water: METRIC_CONFIG.water.defaultGoal,
    mood: METRIC_CONFIG.mood.defaultGoal,
    sleep: METRIC_CONFIG.sleep.defaultGoal,
    exercise: METRIC_CONFIG.exercise.defaultGoal,
  };
}
