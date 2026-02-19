import type { Goals } from "@/db/types";

import { METRIC_CONFIG, METRIC_KEYS } from "@/constants/metrics";

export function createDefaultGoals(): Goals {
  const defaults = {} as Goals;

  for (const metric of METRIC_KEYS) {
    defaults[metric] = METRIC_CONFIG[metric].defaultGoal;
  }

  return defaults;
}
