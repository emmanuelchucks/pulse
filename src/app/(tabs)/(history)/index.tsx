import { useReducer } from "react";
import { ScrollView, Text, View } from "react-native";

import { Button, Card, Description, Label } from "heroui-native";

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
import { numericText, METRIC_TW } from "@/lib/metric-theme";
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
  const surface = "rounded-[22px] border border-foreground/10 bg-foreground/[0.03]";

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-5 pt-1 pb-28 gap-4"
    >
      <Description>Track your progress over time</Description>

      <View className="flex-row gap-3">
        <Card className={`flex-1 ${surface}`}>
          <Card.Body className="p-3 flex-row items-center gap-2">
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
              <Description className="text-[11px]">Completion</Description>
              <Text className={numericText({ size: "sm" })}>{completionRate}%</Text>
            </View>
          </Card.Body>
        </Card>

        <Card className={`flex-1 ${surface}`}>
          <Card.Body className="p-3 flex-row items-center gap-2">
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
              <Description className="text-[11px]">Best Streak</Description>
              <Text className={numericText({ size: "sm" })}>
                {bestStreak} {bestStreak === 1 ? "day" : "days"}
              </Text>
            </View>
          </Card.Body>
        </Card>
      </View>

      <Card className={surface}>
        <Card.Body className="p-2.5 flex-row items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            onPress={() => dispatch({ type: "prev" })}
            accessibilityLabel="Previous week"
            className="w-9 h-9 rounded-[10px]"
          >
            <AppIcon
              name={{ ios: "chevron.left", android: "chevron_left", web: "chevron_left" }}
              color="#8e8e93"
              size={14}
            />
          </Button>

          <Description className="font-medium">
            {fmt(weekStart)} – {fmt(weekEnd)}
          </Description>

          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            onPress={() => dispatch({ type: "next" })}
            isDisabled={!canGoNext}
            accessibilityLabel="Next week"
            className="w-9 h-9 rounded-[10px]"
          >
            <AppIcon
              name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
              color="#8e8e93"
              size={14}
            />
          </Button>
        </Card.Body>
      </Card>

      {METRIC_KEYS.map((key) => (
        <WeekChart key={key} metric={key} weekDates={weekDates} entries={entries} goals={goals} />
      ))}

      <View className="px-1">
        <Label className="text-xl font-bold">Weekly Averages</Label>
      </View>

      <View className="flex-row flex-wrap justify-between gap-y-3">
        {METRIC_KEYS.map((key) => {
          const config = METRIC_CONFIG[key];
          const avg = getWeeklyAverage(entries, key, referenceDate);

          return (
            <Card key={key} className={`w-[48%] ${surface}`}>
              <Card.Body className="p-3 flex-row items-center gap-2">
                <AppIcon name={config.icon} color={config.color} size={14} />
                <View>
                  <Description className="text-[11px]">{config.label}</Description>
                  <Text className={numericText({ size: "xs" })}>
                    {avg.toFixed(1)} {config.unit}
                  </Text>
                </View>
              </Card.Body>
            </Card>
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
  const mc = METRIC_TW[metric];
  const surface = "rounded-[22px] border border-foreground/10 bg-foreground/[0.03]";

  const average =
    values.filter((v) => v > 0).length > 0
      ? (values.reduce((a, b) => a + b, 0) / values.filter((v) => v > 0).length).toFixed(1)
      : "–";

  return (
    <Card className={surface}>
      <Card.Body className="p-4 gap-3">
        <View className="flex-row items-center gap-2">
          <AppIcon name={config.icon} color={config.color} size={15} />
          <Card.Title className="text-[14px]">{config.label}</Card.Title>
        </View>

        <View className="flex-row items-end justify-between h-[92px] px-1">
          {weekDates.map((date, idx) => {
            const val = values[idx] ?? 0;
            const h = maxVal > 0 ? (val / maxVal) * 68 : 0;
            const current = isToday(date);
            const met = val >= goal;

            return (
              <View key={idx} className="items-center gap-1 flex-1">
                <Text className="text-[8px] tabular-nums text-muted">
                  {val > 0 ? (metric === "sleep" ? val.toFixed(1) : String(val)) : ""}
                </Text>

                <View
                  className={`w-[22px] rounded-md ${met ? mc.bg : mc.bg40}`}
                  style={{ height: Math.max(h, 3), borderCurve: "continuous" }}
                />

                <Text className={`text-[10px] ${current ? `font-bold ${mc.text}` : "text-muted"}`}>
                  {getDayLabel(date)}
                </Text>
              </View>
            );
          })}
        </View>

        <View className="flex-row items-center justify-between">
          <Description className="text-[10px]">
            Goal: {goal} {config.unit}
          </Description>
          <Text className="text-[10px] tabular-nums text-muted">Avg: {average} {config.unit}</Text>
        </View>
      </Card.Body>
    </Card>
  );
}
