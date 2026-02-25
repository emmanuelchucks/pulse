import { Button, Card, Description, Label } from "heroui-native";
import { useReducer } from "react";
import { ScrollView, Text, View } from "react-native";
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
import { getEntry, getStreak, toEntriesMap } from "@/features/wellness/domain/analytics";
import { METRIC_TW, numericText, panel } from "@/lib/metric-theme";
import {
  useCompletionRateInRange,
  useEntriesInRange,
  useGoals,
  useMetricAveragesInRange,
} from "@/store/wellness-store";

type WeekAction = { type: "prev" } | { type: "next" };

function weekReducer(state: Date, action: WeekAction): Date {
  const next = new Date(state);
  if (action.type === "prev") next.setDate(next.getDate() - 7);
  else next.setDate(next.getDate() + 7);
  return next;
}

export default function HistoryScreen() {
  const goals = useGoals();
  const [referenceDate, dispatch] = useReducer(weekReducer, new Date());
  const compactCard = panel({ density: "sm" });
  const statCard = panel({ density: "sm" });
  const weekCard = panel({ density: "sm" });

  const weekDates = getWeekDates(referenceDate);
  const weekStart = weekDates[0] ?? referenceDate;
  const weekEnd = weekDates[6] ?? referenceDate;
  const weekStartStr = formatDate(weekStart);
  const weekEndStr = formatDate(weekEnd);

  const today = new Date();
  const todayStr = formatDate(today);
  const last7Start = new Date(today);
  last7Start.setDate(last7Start.getDate() - 6);

  const streakStart = new Date(today);
  streakStart.setDate(streakStart.getDate() - 365);

  const weekRows = useEntriesInRange(weekStartStr, weekEndStr);
  const streakRows = useEntriesInRange(formatDate(streakStart), todayStr);
  const weeklyAverages = useMetricAveragesInRange(weekStartStr, weekEndStr);

  const weekEntries = toEntriesMap(weekRows);
  const streakEntries = toEntriesMap(streakRows);

  const completionRate = Math.round(useCompletionRateInRange(formatDate(last7Start), todayStr) * 100);
  const bestStreak = Math.max(
    ...METRIC_KEYS.map((k) => getStreak(streakEntries, goals, { metric: k })),
  );
  const canGoNext = weekEnd < today;
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <ScrollView
      className="bg-background flex-1"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-5 pt-2 pb-10 gap-4"
    >
      <Description>Track your progress over time</Description>

      <View className="flex-row gap-3">
        <Card className={`flex-1 ${statCard.base()}`}>
          <Card.Body className={statCard.body({ className: "gap-1.5" })}>
            <View className="flex-row items-center gap-2">
              <AppIcon
                name={{
                  ios: "checkmark.circle.fill",
                  android: "check_circle",
                  web: "check_circle",
                }}
                color="#0a84ff"
                size={16}
              />
              <Description className="text-sm">Completion</Description>
            </View>
            <Text className={numericText({ size: "sm" })}>{completionRate}%</Text>
          </Card.Body>
        </Card>

        <Card className={`flex-1 ${statCard.base()}`}>
          <Card.Body className={statCard.body({ className: "gap-1.5" })}>
            <View className="flex-row items-center gap-2">
              <AppIcon
                name={{
                  ios: "flame.fill",
                  android: "local_fire_department",
                  web: "local_fire_department",
                }}
                color="#ff9f0a"
                size={16}
              />
              <Description className="text-sm">Best Streak</Description>
            </View>
            <Text className={numericText({ size: "sm" })}>
              {bestStreak} {bestStreak === 1 ? "day" : "days"}
            </Text>
          </Card.Body>
        </Card>
      </View>

      <Card className={weekCard.base()}>
        <Card.Body
          className={weekCard.body({ className: "py-0 flex-row items-center justify-between" })}
        >
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            onPress={() => dispatch({ type: "prev" })}
            accessibilityLabel="Previous week"
            className="size-11 rounded-xl"
          >
            <AppIcon
              name={{ ios: "chevron.left", android: "chevron_left", web: "chevron_left" }}
              color="#8e8e93"
              size={14}
            />
          </Button>

          <Description className="text-base font-medium">
            {fmt(weekStart)} – {fmt(weekEnd)}
          </Description>

          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            onPress={() => dispatch({ type: "next" })}
            isDisabled={!canGoNext}
            accessibilityLabel="Next week"
            className="size-11 rounded-xl"
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
        <WeekChart
          key={key}
          metric={key}
          weekDates={weekDates}
          entries={weekEntries}
          goals={goals}
        />
      ))}

      <View className="mt-5">
        <Label className="text-xl font-bold">Weekly Averages</Label>
      </View>

      <View className="-mx-1.5 flex-row flex-wrap gap-y-3">
        {METRIC_KEYS.map((key) => {
          const config = METRIC_CONFIG[key];
          const avg = weeklyAverages[key];

          return (
            <View key={key} className="w-1/2 px-1.5">
              <Card className={compactCard.base()}>
                <Card.Body className={compactCard.body({ className: "gap-1.5" })}>
                  <View className="flex-row items-center gap-2">
                    <AppIcon name={config.icon} color={config.color} size={14} />
                    <Description className="text-sm">{config.label}</Description>
                  </View>
                  <Text className={numericText({ size: "xs" })}>
                    {avg.toFixed(1)} {config.unit}
                  </Text>
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

        <View className="h-24 flex-row items-end justify-between px-1">
          {weekDates.map((date, idx) => {
            const val = values[idx] ?? 0;
            const h = maxVal > 0 ? (val / maxVal) * 68 : 0;
            const current = isToday(date);
            const met = val >= goal;

            return (
              <View key={idx} className="flex-1 items-center gap-1">
                <Text className="text-muted text-xs tabular-nums">
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
          <Text className="text-muted text-sm tabular-nums">
            Avg: {average} {config.unit}
          </Text>
        </View>
      </Card.Body>
    </Card>
  );
}
