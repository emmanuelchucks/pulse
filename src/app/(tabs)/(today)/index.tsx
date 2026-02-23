import { ScrollView, Text, View } from "react-native";

import { Button, Card, Chip, Description, Label } from "heroui-native";

import { AppIcon } from "@/components/ui/app-icon";
import { METRIC_CONFIG, METRIC_KEYS, MOOD_EMOJIS, formatDate } from "@/constants/metrics";
import {
  getCompletionRate,
  getEntry,
  getProgress,
  getStreak,
} from "@/features/wellness/domain/analytics";
import { iconBadge, METRIC_TW, numericText, panel } from "@/lib/metric-theme";
import { incrementMetric, useWellnessStore } from "@/store/wellness-store";

const PLUS_ICON = { ios: "plus", android: "add", web: "add" } as const;

export default function DashboardScreen() {
  const { entries, goals } = useWellnessStore();

  const today = new Date();
  const todayStr = formatDate(today);
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const progresses = METRIC_KEYS.map((k) =>
    getProgress(entries, goals, { dateStr: todayStr, metric: k }),
  );
  const overall = Math.round((progresses.reduce((a, b) => a + b, 0) / progresses.length) * 100);
  const completed = progresses.filter((p) => p >= 1).length;
  const weeklyRate = Math.round(getCompletionRate(entries, goals, { days: 7 }) * 100);
  const bestStreak = Math.max(...METRIC_KEYS.map((k) => getStreak(entries, goals, { metric: k })));
  const greeting = getGreeting();
  const summaryBorder = overall >= 100 ? "border-emerald-400" : "border-primary";
  const cardStyles = panel();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-5 pt-1 pb-20 gap-4"
    >
      <Description>{dateLabel}</Description>

      <Card className={cardStyles.base()}>
        <Card.Body className={cardStyles.body({ className: "flex-row items-center gap-4" })}>
          <View className={`size-20 rounded-full border-4 items-center justify-center ${summaryBorder}`}>
            <Text className={numericText({ size: "md" })}>{overall}%</Text>
          </View>

          <View className="flex-1 gap-1">
            <Card.Title>{greeting}</Card.Title>
            <Card.Description>
              {completed}/{METRIC_KEYS.length} goals met today
            </Card.Description>

            <View className="flex-row flex-wrap items-center gap-2 pt-1">
              <Chip size="sm" variant="secondary" className="rounded-full">
                <Chip.Label>Weekly {weeklyRate}%</Chip.Label>
              </Chip>
              <Chip size="sm" variant="secondary" className="rounded-full">
                <Chip.Label>
                  Best {bestStreak} {bestStreak === 1 ? "day" : "days"}
                </Chip.Label>
              </Chip>
            </View>
          </View>
        </Card.Body>
      </Card>

      <Card className={cardStyles.base()}>
        <Card.Body className={cardStyles.body({ className: "flex-row items-center justify-between" })}>
          {METRIC_KEYS.map((key) => {
            const config = METRIC_CONFIG[key];
            const streak = getStreak(entries, goals, { metric: key });

            return (
              <View key={key} className="items-center gap-1">
                <AppIcon name={config.icon} color={config.color} size={16} />
                <Text className={numericText({ size: "xs", className: "font-bold" })}>{streak}</Text>
                <Description className="text-xs">streak</Description>
              </View>
            );
          })}
        </Card.Body>
      </Card>

      <View className="px-1 gap-0.5">
        <Label className="text-xl font-bold">Today&apos;s Metrics</Label>
        <Description>Tap + to quick-add</Description>
      </View>

      {METRIC_KEYS.map((key) => {
        const config = METRIC_CONFIG[key];
        const mc = METRIC_TW[key];
        const entry = getEntry(entries, todayStr);
        const value = entry[key];
        const goal = goals[key];
        const pct = Math.min(goal > 0 ? value / goal : 0, 1);
        const display = key === "mood" && value > 0 ? MOOD_EMOJIS[value] : `${value}`;
        const unit = key === "mood" ? "" : `/${goal} ${config.unit}`;

        return (
          <Card key={key} className={cardStyles.base()}>
            <Card.Body className={cardStyles.body({ className: "flex-row items-center gap-3" })}>
              <View className="items-center gap-1.5">
                <View className={`${iconBadge({ size: "lg" })} ${mc.bg10}`}>
                  <AppIcon name={config.icon} color={config.color} size={22} />
                </View>

                <View className={`w-10 h-1 rounded-full ${mc.bg15}`}>
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

              <Button
                size="sm"
                variant="ghost"
                isIconOnly
                onPress={() => {
                  incrementMetric(todayStr, key);
                }}
                accessibilityLabel={`Quick add ${config.label}`}
                className={`size-11 rounded-2xl ${mc.bg10}`}
              >
                <AppIcon name={PLUS_ICON} color={config.color} size={20} />
              </Button>
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
