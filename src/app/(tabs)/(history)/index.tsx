import { useReducer } from "react";
import { ScrollView, Text, View } from "react-native";

import { Button, Card, Description, Label } from "heroui-native";

import type { MetricKey } from "@/constants/metrics";
import type { DailyEntry, Goals } from "@/db/types";

import { AppIcon } from "@/components/ui/app-icon";
import {
  formatDate,
  getDayLabel,
  getWeekDates,
  isToday,
  METRIC_CONFIG,
  METRIC_KEYS,
} from "@/constants/metrics";
import {
  getCompletionRate,
  getEntry,
  getStreak,
  getWeeklyAverage,
} from "@/features/wellness/domain/analytics";
import { METRIC_TW, numericText, panel } from "@/lib/metric-theme";
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
  const cardStyles = panel();
  const compactCard = panel({ density: "sm" });

  const completionRate = Math.round(getCompletionRate(entries, goals, { days: 7 }) * 100);
  const bestStreak = Math.max(...METRIC_KEYS.map((k) => getStreak(entries, goals, { metric: k })));
  const weekDates = getWeekDates(referenceDate);
  const weekStart = weekDates[0] ?? referenceDate;
  const weekEnd = weekDates[6] ?? referenceDate;
  const canGoNext = weekEnd < new Date();
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-4 pt-1 pb-20 gap-3"
    >
      <Description>Track your progress over time</Description>

      <View className="flex-row gap-3">
        <Card className={`flex-1 ${cardStyles.base()}`}>
          <Card.Body className={cardStyles.body({ className: "flex-row items-start gap-2" })}>
            <View className="pt-0.5">
              <AppIcon
                name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }}
                color="#0a84ff"
                size={16}
              />
            </View>
            <View>
              <Description className="text-sm">Completion</Description>
              <Text className={numericText({ size: "sm" })}>{completionRate}%</Text>
            </View>
          </Card.Body>
        </Card>

        <Card className={`flex-1 ${cardStyles.base()}`}>
          <Card.Body className={cardStyles.body({ className: "flex-row items-start gap-2" })}>
            <View className="pt-0.5">
              <AppIcon
                name={{ ios: "flame.fill", android: "local_fire_department", web: "local_fire_department" }}
                color="#ff9f0a"
                size={16}
              />
            </View>
            <View>
              <Description className="text-sm">Best Streak</Description>
              <Text className={numericText({ size: "sm" })}>
                {bestStreak} {bestStreak === 1 ? "day" : "days"}
              </Text>
            </View>
          </Card.Body>
        </Card>
      </View>

      <Card className={cardStyles.base()}>
        <Card.Body className={cardStyles.body({ className: "py-2.5 flex-row items-center justify-between" })}>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            onPress={() => dispatch({ type: "prev" })}
            accessibilityLabel="Previous week"
            className="size-9 rounded-xl"
          >
            <AppIcon name={{ ios: "chevron.left", android: "chevron_left", web: "chevron_left" }} color="#8e8e93" size={14} />
          </Button>

          <Description className="text-lg font-medium">
            {fmt(weekStart)} – {fmt(weekEnd)}
          </Description>

          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            onPress={() => dispatch({ type: "next" })}
            isDisabled={!canGoNext}
            accessibilityLabel="Next week"
            className="size-9 rounded-xl"
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

      <View className="flex-row flex-wrap -mx-1.5 gap-y-3">
        {METRIC_KEYS.map((key) => {
          const config = METRIC_CONFIG[key];
          const avg = getWeeklyAverage(entries, key, referenceDate);

          return (
            <View key={key} className="w-1/2 px-1.5">
              <Card className={compactCard.base()}>
                <Card.Body className={compactCard.body({ className: "flex-row items-start gap-2" })}>
                  <View className="pt-0.5">
                    <AppIcon name={config.icon} color={config.color} size={14} />
                  </View>
                  <View>
                    <Description className="text-sm">{config.label}</Description>
                    <Text className={numericText({ size: "xs" })}>
                      {avg.toFixed(1)} {config.unit}
                    </Text>
                  </View>
                </Card.Body>
              </Card>
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
  const mc = METRIC_TW[metric];
  const cardStyles = panel({ density: "sm" });

  const average =
    values.filter((v) => v > 0).length > 0
      ? (values.reduce((a, b) => a + b, 0) / values.filter((v) => v > 0).length).toFixed(1)
      : "–";

  return (
    <Card className={cardStyles.base()}>
      <Card.Body className={cardStyles.body({ className: "gap-3" })}>
        <View className="flex-row items-center gap-2">
          <AppIcon name={config.icon} color={config.color} size={15} />
          <Card.Title className="text-base">{config.label}</Card.Title>
        </View>

        <View className="flex-row items-end justify-between h-24 px-1">
          {weekDates.map((date, idx) => {
            const val = values[idx] ?? 0;
            const h = maxVal > 0 ? (val / maxVal) * 68 : 0;
            const current = isToday(date);
            const met = val >= goal;

            return (
              <View key={idx} className="items-center gap-1 flex-1">
                <Text className="text-xs tabular-nums text-muted">
                  {val > 0 ? (metric === "sleep" ? val.toFixed(1) : String(val)) : ""}
                </Text>

                <View
                  className={`w-5 rounded-md ${met ? mc.bg : mc.bg40}`}
                  style={{ height: Math.max(h, 6), borderCurve: "continuous" }}
                />

                <Text className={`text-sm ${current ? `font-semibold ${mc.text}` : "text-muted"}`}>
                  {getDayLabel(date)}
                </Text>
              </View>
            );
          })}
        </View>

        <View className="flex-row items-center justify-between">
          <Description className="text-sm">
            Goal: {goal} {config.unit}
          </Description>
          <Text className="text-sm tabular-nums text-muted">
            Avg: {average} {config.unit}
          </Text>
        </View>
      </Card.Body>
    </Card>
  );
}
