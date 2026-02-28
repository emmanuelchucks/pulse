import { addDays, format as formatDateFns, subDays } from "date-fns";
import { Button, Card, Description, Label } from "heroui-native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import {
  formatDate,
  getWeekDates,
  METRIC_CONFIG,
  METRIC_KEYS,
} from "@/constants/metrics";
import { toEntriesMap } from "@/features/wellness/domain/analytics";
import { WeekChart } from "@/features/wellness/components/week-chart";
import { getBestStreak } from "@/features/wellness/domain/streak-summary";
import { numericText, panel } from "@/lib/metric-theme";
import {
  useCompletionRateInRange,
  useEntriesInRange,
  useGoals,
  useMetricAveragesInRange,
} from "@/store/wellness-queries";

export default function HistoryScreen() {
  const goals = useGoals();
  const [referenceDate, setReferenceDate] = useState(new Date());
  const smCard = panel({ density: "sm" });

  const goToPrevWeek = () => setReferenceDate((d) => addDays(d, -7));
  const goToNextWeek = () => setReferenceDate((d) => addDays(d, 7));

  const weekDates = getWeekDates(referenceDate);
  const weekStart = weekDates[0] ?? referenceDate;
  const weekEnd = weekDates[6] ?? referenceDate;
  const weekStartStr = formatDate(weekStart);
  const weekEndStr = formatDate(weekEnd);

  const today = new Date();
  const todayStr = formatDate(today);
  const last7Start = subDays(today, 6);
  const streakStart = subDays(today, 365);

  const weekRows = useEntriesInRange(weekStartStr, weekEndStr);
  const streakRows = useEntriesInRange(formatDate(streakStart), todayStr);
  const weeklyAverages = useMetricAveragesInRange(weekStartStr, weekEndStr);

  const weekEntries = toEntriesMap(weekRows);
  const streakEntries = toEntriesMap(streakRows);

  const completionRate = Math.round(
    useCompletionRateInRange(formatDate(last7Start), todayStr) * 100,
  );
  const bestStreak = getBestStreak(streakEntries, goals);
  const canGoNext = weekEnd < today;
  const fmt = (d: Date) => formatDateFns(d, "MMM d");

  return (
    <ScrollView
      className="bg-background flex-1"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-5 pt-2 pb-10 gap-4"
    >
      <Description>Track your progress over time</Description>

      <View className="flex-row gap-3">
        <Card className={`flex-1 ${smCard.base()}`}>
          <Card.Body className={smCard.body({ className: "gap-1.5" })}>
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

        <Card className={`flex-1 ${smCard.base()}`}>
          <Card.Body className={smCard.body({ className: "gap-1.5" })}>
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

      <Card className={smCard.base()}>
        <Card.Body
          className={smCard.body({ className: "py-0 flex-row items-center justify-between" })}
        >
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            onPress={goToPrevWeek}
            accessibilityLabel="Previous week"
            className="size-11 rounded-xl"
          >
            <AppIcon
              name={{ ios: "chevron.left", android: "chevron_left", web: "chevron_left" }}
              color="#8e8e93"
              size={14}
            />
          </Button>

          <Description testID="history-week-range" className="text-base font-medium">
            {fmt(weekStart)} – {fmt(weekEnd)}
          </Description>

          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            onPress={goToNextWeek}
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
              <Card className={smCard.base()}>
                <Card.Body className={smCard.body({ className: "gap-1.5" })}>
                  <View className="flex-row items-center gap-2">
                    <AppIcon name={config.icon} color={config.color} size={14} />
                    <Description className="text-sm">{config.label}</Description>
                  </View>
                  <Text testID={`history-${key}-average`} className={numericText({ size: "xs" })}>
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

