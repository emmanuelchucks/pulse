import { addDays, format, isSameDay, startOfWeek } from "date-fns";

export const METRIC_CONFIG = {
  water: {
    key: "water" as const,
    label: "Water",
    unit: "glasses",
    icon: "drop.fill" as const,
    color: "#38bdf8",
    defaultGoal: 8,
    step: 1,
    min: 0,
    max: 20,
  },
  mood: {
    key: "mood" as const,
    label: "Mood",
    unit: "",
    icon: "face.smiling.fill" as const,
    color: "#f472b6",
    defaultGoal: 5,
    step: 1,
    min: 1,
    max: 5,
  },
  sleep: {
    key: "sleep" as const,
    label: "Sleep",
    unit: "hours",
    icon: "moon.fill" as const,
    color: "#a78bfa",
    defaultGoal: 8,
    step: 0.5,
    min: 0,
    max: 14,
  },
  exercise: {
    key: "exercise" as const,
    label: "Exercise",
    unit: "min",
    icon: "flame.fill" as const,
    color: "#34d399",
    defaultGoal: 30,
    step: 5,
    min: 0,
    max: 180,
  },
} as const;

export type MetricKey = keyof typeof METRIC_CONFIG;
export const METRIC_KEYS = Object.keys(METRIC_CONFIG) as MetricKey[];

export const MOOD_LABELS = ["", "Awful", "Bad", "Okay", "Good", "Great"] as const;
export const MOOD_EMOJIS = ["", "😞", "😔", "😐", "😊", "😄"] as const;

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getWeekDates(referenceDate: Date): Date[] {
  const monday = startOfWeek(referenceDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function getDayLabel(date: Date): string {
  return format(date, "EEE");
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}
