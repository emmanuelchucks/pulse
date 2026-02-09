import "expo-sqlite/localStorage/install";
import { useSyncExternalStore } from "react";
import {
  MetricKey,
  METRIC_KEYS,
  METRIC_CONFIG,
  formatDate,
} from "@/constants/metrics";

// --- Types ---

export type DailyEntry = {
  date: string;
  water: number;
  mood: number;
  sleep: number;
  exercise: number;
};

export type Goals = Record<MetricKey, number>;

type WellnessState = {
  entries: Record<string, DailyEntry>;
  goals: Goals;
};

// --- Constants ---

const STORAGE_KEY_ENTRIES = "pulse_entries";
const STORAGE_KEY_GOALS = "pulse_goals";

function getDefaultGoals(): Goals {
  return {
    water: 8,
    mood: 5,
    sleep: 8,
    exercise: 30,
  };
}

function createEmptyEntry(dateStr: string): DailyEntry {
  return { date: dateStr, water: 0, mood: 0, sleep: 0, exercise: 0 };
}

// --- Singleton Store (synchronous with localStorage) ---

let listeners: (() => void)[] = [];

function loadState(): WellnessState {
  const entriesRaw = localStorage.getItem(STORAGE_KEY_ENTRIES);
  const goalsRaw = localStorage.getItem(STORAGE_KEY_GOALS);
  return {
    entries: entriesRaw ? JSON.parse(entriesRaw) : {},
    goals: goalsRaw
      ? { ...getDefaultGoals(), ...JSON.parse(goalsRaw) }
      : getDefaultGoals(),
  };
}

let state: WellnessState = loadState();

function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): WellnessState {
  return state;
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(state.entries));
}

function saveGoals() {
  localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(state.goals));
}

// --- Actions ---

function getOrCreateEntry(dateStr: string): DailyEntry {
  if (!state.entries[dateStr]) {
    state.entries[dateStr] = createEmptyEntry(dateStr);
  }
  return state.entries[dateStr];
}

export function updateMetric(
  dateStr: string,
  metric: MetricKey,
  value: number
) {
  const entry = getOrCreateEntry(dateStr);
  const config = METRIC_CONFIG[metric];
  entry[metric] = Math.max(config.min, Math.min(config.max, value));
  state.entries = { ...state.entries, [dateStr]: { ...entry } };
  emit();
  saveEntries();
}

export function incrementMetric(dateStr: string, metric: MetricKey) {
  const entry = getOrCreateEntry(dateStr);
  const config = METRIC_CONFIG[metric];
  updateMetric(dateStr, metric, entry[metric] + config.step);
}

export function decrementMetric(dateStr: string, metric: MetricKey) {
  const entry = getOrCreateEntry(dateStr);
  const config = METRIC_CONFIG[metric];
  updateMetric(dateStr, metric, entry[metric] - config.step);
}

export function updateGoal(metric: MetricKey, value: number) {
  state.goals = { ...state.goals, [metric]: value };
  emit();
  saveGoals();
}

export function resetDay(dateStr: string) {
  state.entries = { ...state.entries, [dateStr]: createEmptyEntry(dateStr) };
  emit();
  saveEntries();
}

export function clearAllData() {
  state.entries = {};
  state.goals = getDefaultGoals();
  emit();
  localStorage.removeItem(STORAGE_KEY_ENTRIES);
  localStorage.removeItem(STORAGE_KEY_GOALS);
}

// --- Computed helpers (take snapshot args for React Compiler compat) ---

export function getEntry(
  entries: Record<string, DailyEntry>,
  dateStr: string
): DailyEntry {
  return entries[dateStr] ?? createEmptyEntry(dateStr);
}

export function getProgress(
  entries: Record<string, DailyEntry>,
  goals: Goals,
  dateStr: string,
  metric: MetricKey
): number {
  const entry = getEntry(entries, dateStr);
  const goal = goals[metric];
  if (goal === 0) return 0;
  return Math.min(entry[metric] / goal, 1);
}

export function getStreak(
  entries: Record<string, DailyEntry>,
  goals: Goals,
  metric: MetricKey
): number {
  const today = new Date();
  let streak = 0;
  const d = new Date(today);

  while (true) {
    const dateStr = formatDate(d);
    const entry = entries[dateStr];
    if (!entry || entry[metric] === 0) break;
    if (entry[metric] / goals[metric] < 1) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return streak;
}

export function getWeeklyAverage(
  entries: Record<string, DailyEntry>,
  metric: MetricKey,
  referenceDate: Date
): number {
  let total = 0;
  let count = 0;
  const d = new Date(referenceDate);
  for (let i = 0; i < 7; i++) {
    const dateStr = formatDate(d);
    const entry = entries[dateStr];
    if (entry && entry[metric] > 0) {
      total += entry[metric];
      count++;
    }
    d.setDate(d.getDate() - 1);
  }
  return count > 0 ? total / count : 0;
}

export function getCompletionRate(
  entries: Record<string, DailyEntry>,
  goals: Goals,
  days: number = 7
): number {
  const today = new Date();
  let completedMetrics = 0;
  const totalMetrics = days * METRIC_KEYS.length;

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDate(d);
    const entry = entries[dateStr];
    if (entry) {
      for (const key of METRIC_KEYS) {
        if (entry[key] > 0 && entry[key] >= goals[key]) {
          completedMetrics++;
        }
      }
    }
  }

  return totalMetrics > 0 ? completedMetrics / totalMetrics : 0;
}

// --- Hook ---

export function useWellnessStore() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
