import { METRIC_KEYS } from "@/constants/metrics";
import type { Goals } from "@/db/types";
import type { DailyEntry } from "@/db/types";
import { getStreak } from "@/features/wellness/domain/analytics";

export function getBestStreak(entries: Record<string, DailyEntry>, goals: Goals): number {
  return Math.max(...METRIC_KEYS.map((metric) => getStreak(entries, goals, { metric })));
}
