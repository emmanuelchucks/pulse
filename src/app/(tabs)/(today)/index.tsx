import { format as formatDateFns, subDays } from "date-fns";
import { SymbolView } from "expo-symbols";
import { Card, Description, Label } from "heroui-native";
import { Pressable, ScrollView, Text, View, useColorScheme } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { ProgressRing } from "@/components/ui/progress-ring";
import { METRIC_CONFIG, METRIC_KEYS, MOOD_EMOJIS, formatDate } from "@/constants/metrics";
import { getStreak, toEntriesMap } from "@/features/wellness/domain/analytics";
import { getBestStreak } from "@/features/wellness/domain/streak-summary";
import { iconBadge, METRIC_TW, numericText, panel } from "@/lib/metric-theme";
import { runOrAlert } from "@/lib/run-or-alert";
import { incrementMetric } from "@/store/wellness-actions";
import {
  useCompletionRateInRange,
  useEntriesInRange,
  useEntryByDate,
  useGoals,
  useTodaySummary,
} from "@/store/wellness-queries";

export default function DashboardScreen() {
  const goals = useGoals();

  const isDark = useColorScheme() === "dark";
  const today = new Date();
  const todayStr = formatDate(today);
  const todayEntry = useEntryByDate(todayStr);

  const last7Start = subDays(today, 6);
  const streakStart = subDays(today, 365);

  const streakRows = useEntriesInRange(formatDate(streakStart), todayStr);
  const streakEntries = toEntriesMap(streakRows);
  const dateLabel = formatDateFns(today, "EEEE, MMMM d");

  const { completedMetrics, overallPercent } = useTodaySummary(todayStr);
  const weeklyRate = Math.round(useCompletionRateInRange(formatDate(last7Start), todayStr) * 100);
  const bestStreak = getBestStreak(streakEntries, goals);
  const greeting = getGreeting();
  const cardStyles = panel();

  return (
    <ScrollView
      className="bg-background flex-1"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-5 pt-2 pb-10 gap-4"
    >
      <Description>{dateLabel}</Description>

      <Card className={cardStyles.base()}>
        <Card.Body
          className={cardStyles.body({ className: "flex-row items-center gap-4 px-5 py-3" })}
        >
          <ProgressRing
            value={overallPercent}
            color={overallPercent >= 100 ? "#34d399" : "#38bdf8"}
            trackColor={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}
          />

          <View className="flex-1 gap-0.5">
            <Card.Title>{greeting}</Card.Title>
            <Card.Description>
              {completedMetrics}/{METRIC_KEYS.length} goals met today
            </Card.Description>

            <Description className="text-foreground/85 pt-1 font-medium" numberOfLines={1}>
              Weekly {weeklyRate}% • Best {bestStreak} {bestStreak === 1 ? "day" : "days"}
            </Description>
          </View>
        </Card.Body>
      </Card>

      <Card className={cardStyles.base()}>
        <Card.Body
          className={cardStyles.body({
            className: "flex-row items-center justify-between px-4 py-3",
          })}
        >
          {METRIC_KEYS.map((key) => {
            const config = METRIC_CONFIG[key];
            const streak = getStreak(streakEntries, goals, { metric: key });

            return (
              <View key={key} className="items-center gap-1">
                <AppIcon name={config.icon} color={config.color} size={16} />
                <Text className={numericText({ size: "xs", className: "font-bold" })}>
                  {streak}
                </Text>
                <Description className="text-sm">streak</Description>
              </View>
            );
          })}
        </Card.Body>
      </Card>

      <View className="mt-5 gap-1">
        <Label className="text-xl font-bold">Today&apos;s Metrics</Label>
        <Description>Tap + to quick-add</Description>
      </View>

      {METRIC_KEYS.map((key) => {
        const config = METRIC_CONFIG[key];
        const mc = METRIC_TW[key];
        const value = todayEntry[key];
        const goal = goals[key];
        const pct = Math.min(goal > 0 ? value / goal : 0, 1);
        const display = key === "mood" && value > 0 ? MOOD_EMOJIS[value] : `${value}`;
        const unit = key === "mood" ? "" : `/${goal} ${config.unit}`;

        return (
          <Card key={key} className={cardStyles.base()}>
            <Card.Body
              className={cardStyles.body({ className: "flex-row items-center gap-3 px-4 py-3.5" })}
            >
              <View className="items-center gap-2">
                <View className={`${iconBadge({ size: "lg" })} ${mc.bg10}`}>
                  <AppIcon name={config.icon} color={config.color} size={22} />
                </View>

                <View className={`h-1 w-10 rounded-full ${mc.bg15}`}>
                  <View
                    className={`h-1 rounded-full ${mc.bg}`}
                    style={{ width: `${Math.round(pct * 100)}%` }}
                  />
                </View>
              </View>

              <View className="flex-1 gap-0.5">
                <Description className="font-medium">{config.label}</Description>
                <View className="flex-row items-baseline gap-2">
                  <Text className={numericText({ size: "lg" })}>{display}</Text>
                  <Description className="text-sm">{unit}</Description>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  runOrAlert(() => incrementMetric(todayStr, key));
                }}
                disabled={value >= config.max}
                accessibilityRole="button"
                accessibilityLabel={`Quick add ${config.label}`}
                className={`size-11 rounded-2xl ${mc.bg10} items-center justify-center self-center ${value >= config.max ? "opacity-45" : ""}`}
              >
                <SymbolView
                  name={{ ios: "plus", android: "add", web: "add" }}
                  tintColor={config.color}
                  style={{ width: 22, height: 22 }}
                />
              </Pressable>
            </Card.Body>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning ☀️";
  if (hour < 17) return "Good afternoon 🌤";
  return "Good evening 🌙";
}
