import type { AndroidSymbol, SFSymbol } from "expo-symbols";

import { addDays, format, isSameDay, startOfWeek } from "date-fns";

export type MetricKey = "water" | "mood" | "sleep" | "exercise";

type MetricConfig = {
  key: MetricKey;
  label: string;
  unit: string;
  icon: {
    ios: SFSymbol;
    android: AndroidSymbol;
    web: AndroidSymbol;
  };
  color: string;
  defaultGoal: number;
  step: number;
  min: number;
  max: number;
};

export const METRIC_KEYS: MetricKey[] = ["water", "mood", "sleep", "exercise"];

export const METRIC_CONFIG: Record<MetricKey, MetricConfig> = {
  water: {
    key: "water",
    label: "Water",
    unit: "glasses",
    icon: {
      ios: "drop.fill",
      android: "water_drop",
      web: "water_drop",
    },
    color: "#38bdf8",
    defaultGoal: 8,
    step: 1,
    min: 0,
    max: 20,
  },
  mood: {
    key: "mood",
    label: "Mood",
    unit: "",
    icon: {
      ios: "face.smiling.fill",
      android: "mood",
      web: "mood",
    },
    color: "#f472b6",
    defaultGoal: 5,
    step: 1,
    min: 1,
    max: 5,
  },
  sleep: {
    key: "sleep",
    label: "Sleep",
    unit: "hours",
    icon: {
      ios: "moon.fill",
      android: "dark_mode",
      web: "dark_mode",
    },
    color: "#a78bfa",
    defaultGoal: 8,
    step: 0.5,
    min: 0,
    max: 14,
  },
  exercise: {
    key: "exercise",
    label: "Exercise",
    unit: "min",
    icon: {
      ios: "flame.fill",
      android: "local_fire_department",
      web: "local_fire_department",
    },
    color: "#34d399",
    defaultGoal: 30,
    step: 5,
    min: 0,
    max: 180,
  },
};

export const MOOD_LABELS = ["", "Awful", "Bad", "Okay", "Good", "Great"];
export const MOOD_EMOJIS = ["", "😞", "😔", "😐", "😊", "😄"];

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
