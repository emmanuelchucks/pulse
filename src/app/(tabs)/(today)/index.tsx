import { ScrollView, Text, View } from "react-native";

import { Button, Card, Chip, Description, Label } from "heroui-native";

import { AppIcon } from "@/components/ui/app-icon";
import { METRIC_KEYS, METRIC_CONFIG, MOOD_EMOJIS, formatDate } from "@/constants/metrics";
import {
  getEntry,
  getProgress,
  getStreak,
  getCompletionRate,
} from "@/features/wellness/domain/analytics";
import { numericText, METRIC_TW } from "@/lib/metric-theme";
import { useWellnessStore, incrementMetric } from "@/store/wellness-store";

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

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-5 pb-10 gap-3"
    >
      <Description className="mt-1">{dateLabel}</Description>

      {/* Summary card */}
      <Card>
        <Card.Body className="flex-row items-center gap-4">
          <View
            className={`size-[76px] rounded-full border-[5px] items-center justify-center ${
              overall >= 100 ? "border-emerald-400" : "border-[#0a84ff]"
            }`}
          >
            <Text className={numericText({ size: "md" })}>{overall}%</Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Card.Title>{greeting}</Card.Title>
            <Card.Description>
              {completed}/{METRIC_KEYS.length} goals met today
            </Card.Description>
            <View className="flex-row items-center gap-4 mt-2">
              <Chip variant="secondary" size="sm" color="default">
                <Chip.Label>Weekly {weeklyRate}%</Chip.Label>
              </Chip>
              <Chip variant="secondary" size="sm" color="default">
                <Chip.Label>
                  Best {bestStreak} {bestStreak === 1 ? "day" : "days"}
                </Chip.Label>
              </Chip>
            </View>
          </View>
        </Card.Body>
      </Card>

      {/* Streak bar */}
      <Card>
        <Card.Body className="flex-row items-center justify-around py-0.5">
          {METRIC_KEYS.map((key) => {
            const config = METRIC_CONFIG[key];
            const streak = getStreak(entries, goals, { metric: key });
            return (
              <View key={key} className="items-center gap-1 py-0.5">
                <AppIcon name={config.icon} color={config.color} size={16} />
                <Text
                  className={numericText({ size: "xs", className: "font-bold" })}
                  selectable
                >
                  {streak}
                </Text>
                <Description className="text-[10px]">streak</Description>
              </View>
            );
          })}
        </Card.Body>
      </Card>

      {/* Section header */}
      <View className="px-1 mt-1">
        <Label className="text-xl font-bold">Today&apos;s Metrics</Label>
        <Description className="mt-0.5">Tap + to quick-add</Description>
      </View>

      {/* Metric cards */}
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
          <Card key={key}>
            <Card.Body className="flex-row items-center gap-3.5">
              <View className="items-center">
                <View
                  className={`w-12 h-12 rounded-[14px] items-center justify-center ${mc.bg10}`}
                  style={{ borderCurve: "continuous" }}
                >
                  <AppIcon name={config.icon} color={config.color} size={22} />
                </View>
                <View className={`w-10 h-1 rounded-full mt-1.5 ${mc.bg15}`}>
                  <View
                    className={`h-1 rounded-full ${mc.bg}`}
                    style={{ width: `${Math.round(pct * 100)}%` }}
                  />
                </View>
              </View>
              <View className="flex-1">
                <Description className="font-medium">{config.label}</Description>
                <View className="flex-row items-baseline gap-2">
                  <Text className={numericText({ size: "lg" })} selectable>
                    {display}
                  </Text>
                  <Description className="text-[11px]">{unit}</Description>
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
                className={`w-10 h-10 rounded-xl ${mc.bg10}`}
              >
                <Button.Label className={`text-[20px] font-bold ${mc.text}`}>+</Button.Label>
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
