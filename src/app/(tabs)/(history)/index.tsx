import { useReducer } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import type { MetricKey } from "@/constants/metrics";
import type { DailyEntry, Goals } from "@/db/types";

import { AppIcon } from "@/components/ui/app-icon";
import {
  METRIC_KEYS,
  METRIC_CONFIG,
  getWeekDates,
  getDayLabel,
  formatDate,
  isToday,
} from "@/constants/metrics";
import {
  getEntry,
  getWeeklyAverage,
  getCompletionRate,
  getStreak,
} from "@/features/wellness/domain/analytics";
import {
  card,
  caption,
  statLabel,
  statValue,
  numericDisplay,
  sectionHeader,
  sectionTitle,
  scrollContent,
  row,
  METRIC_CLASSES,
} from "@/lib/styles";
import { useWellnessStore } from "@/store/wellness-store";

type WeekAction = { type: "prev" } | { type: "next" };

function weekReducer(state: Date, action: WeekAction): Date {
  const next = new Date(state);
  if (action.type === "prev") next.setDate(next.getDate() - 7);
  else next.setDate(next.getDate() + 7);
  return next;
}

export default function HistoryScreen() {
  const { entries, goals } = useWellnessStore();
  const [referenceDate, dispatch] = useReducer(weekReducer, new Date());

  const completionRate = Math.round(getCompletionRate(entries, goals, { days: 7 }) * 100);
  const bestStreak = Math.max(...METRIC_KEYS.map((k) => getStreak(entries, goals, { metric: k })));
  const weekDates = getWeekDates(referenceDate);
  const weekStart = weekDates[0] ?? referenceDate;
  const weekEnd = weekDates[6] ?? referenceDate;
  const canGoNext = weekEnd < new Date();
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <ScrollView
      className="flex-1 bg-sf-bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName={scrollContent()}
    >
      <View className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Text className={caption()}>Track your progress over time</Text>
      </View>

      <View className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <View className="flex-row gap-3">
          <View className={card({ size: "sm", className: "flex-1 p-3" })}>
            <View className={row({ gap: "sm" })}>
              <AppIcon
                name={{
                  ios: "checkmark.circle.fill",
                  android: "check_circle",
                  web: "check_circle",
                }}
                color="#0a84ff"
                size={16}
              />
              <View>
                <Text className={statLabel()}>Completion</Text>
                <Text className={numericDisplay({ size: "sm" })}>{completionRate}%</Text>
              </View>
            </View>
          </View>
          <View className={card({ size: "sm", className: "flex-1 p-3" })}>
            <View className={row({ gap: "sm" })}>
              <AppIcon
                name={{
                  ios: "flame.fill",
                  android: "local_fire_department",
                  web: "local_fire_department",
                }}
                color="#ff9f0a"
                size={16}
              />
              <View>
                <Text className={statLabel()}>Best Streak</Text>
                <Text className={numericDisplay({ size: "sm" })}>
                  {bestStreak} {bestStreak === 1 ? "day" : "days"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <View className={row({ justify: "between", className: "px-1" })}>
          <Pressable
            onPress={() => dispatch({ type: "prev" })}
            accessibilityLabel="Previous week"
            className="w-9 h-9 rounded-[10px] items-center justify-center corner-squircle"
          >
            <AppIcon
              name={{ ios: "chevron.left", android: "chevron_left", web: "chevron_left" }}
              color="#8e8e93"
              size={14}
            />
          </Pressable>
          <Text className={caption({ className: "font-medium" })}>
            {fmt(weekStart)} – {fmt(weekEnd)}
          </Text>
          <Pressable
            onPress={() => dispatch({ type: "next" })}
            disabled={!canGoNext}
            accessibilityLabel="Next week"
            className={`w-9 h-9 rounded-[10px] items-center justify-center corner-squircle ${canGoNext ? "opacity-100" : "opacity-30"}`}
          >
            <AppIcon
              name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
              color="#8e8e93"
              size={14}
            />
          </Pressable>
        </View>
      </View>

      {METRIC_KEYS.map((key) => (
        <View key={key} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <WeekChart metric={key} weekDates={weekDates} entries={entries} goals={goals} />
        </View>
      ))}

      <View className={sectionHeader()}>
        <Text className={sectionTitle()}>Weekly Averages</Text>
      </View>
      <View className="flex-row flex-wrap gap-3">
        {METRIC_KEYS.map((key) => {
          const config = METRIC_CONFIG[key];
          const avg = getWeeklyAverage(entries, key, referenceDate);
          return (
            <View
              key={key}
              className="w-[47%] animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <View className={card({ size: "sm", className: "p-3" })}>
                <View className={row({ gap: "sm" })}>
                  <AppIcon name={config.icon} color={config.color} size={14} />
                  <View>
                    <Text className={statLabel()}>{config.label}</Text>
                    <Text className={numericDisplay({ size: "xs" })}>
                      {avg.toFixed(1)} {config.unit}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function WeekChart({
  metric,
  weekDates,
  entries,
  goals,
}: {
  metric: MetricKey;
  weekDates: Date[];
  entries: Record<string, DailyEntry>;
  goals: Goals;
}) {
  const config = METRIC_CONFIG[metric];
  const goal = goals[metric];
  const values = weekDates.map((d) => getEntry(entries, formatDate(d))[metric]);
  const maxVal = Math.max(...values, goal);
  const colors = METRIC_CLASSES[metric];

  return (
    <View className={card({ padded: true })}>
      <View className={row({ gap: "sm" })}>
        <AppIcon name={config.icon} color={config.color} size={15} />
        <Text className={statValue()}>{config.label}</Text>
      </View>

      <View className={row({ justify: "around", className: "items-end mt-3 h-[90px]" })}>
        {weekDates.map((date, idx) => {
          const val = values[idx] ?? 0;
          const h = maxVal > 0 ? (val / maxVal) * 70 : 0;
          const current = isToday(date);
          const met = val >= goal;

          return (
            <View key={idx} className="items-center gap-1 flex-1">
              <Text className="text-[8px] tabular-nums text-sf-text-3">
                {val > 0 ? (metric === "sleep" ? val.toFixed(1) : String(val)) : ""}
              </Text>
              <View
                className={`w-[22px] rounded-md corner-squircle ${met ? colors.bg : colors.bg40}`}
                style={{ height: Math.max(h, 3) }}
              />
              <Text
                className={`text-[10px] ${current ? `font-bold ${colors.text}` : "font-normal text-sf-gray"}`}
              >
                {getDayLabel(date)}
              </Text>
            </View>
          );
        })}
      </View>

      <View className={row({ justify: "between", className: "mt-2.5" })}>
        <Text className={statLabel({ className: "text-[10px]" })}>
          Goal: {goal} {config.unit}
        </Text>
        <Text className="text-[10px] tabular-nums text-sf-text-3">
          Avg:{" "}
          {values.filter((v) => v > 0).length > 0
            ? (values.reduce((a, b) => a + b, 0) / values.filter((v) => v > 0).length).toFixed(1)
            : "–"}{" "}
          {config.unit}
        </Text>
      </View>
    </View>
  );
}
