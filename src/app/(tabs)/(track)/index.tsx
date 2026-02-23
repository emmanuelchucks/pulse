import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";

import { Button, Card, Description } from "heroui-native";

import type { MetricKey } from "@/constants/metrics";
import type { DailyEntry, Goals } from "@/db/types";

import { AppIcon } from "@/components/ui/app-icon";
import {
  METRIC_KEYS,
  METRIC_CONFIG,
  MOOD_EMOJIS,
  MOOD_LABELS,
  formatDate,
} from "@/constants/metrics";
import { getEntry } from "@/features/wellness/domain/analytics";
import { numericText, METRIC_TW } from "@/lib/metric-theme";
import {
  useWellnessStore,
  incrementMetric,
  decrementMetric,
  updateMetric,
  resetDay,
} from "@/store/wellness-store";

export default function TrackScreen() {
  const { entries, goals } = useWellnessStore();
  const todayStr = formatDate(new Date());

  const handleReset = () => {
    Alert.alert("Reset Day", "Reset all metrics for today?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          if (Platform.OS === "ios") {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          resetDay(todayStr);
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button
              size="sm"
              variant="danger-soft"
              onPress={handleReset}
              accessibilityLabel="Reset Day"
              className="rounded-xl"
            >
              <AppIcon
                name={{ ios: "arrow.counterclockwise", android: "restart_alt", web: "restart_alt" }}
                color="#ff3b30"
                size={13}
              />
              <Button.Label>Reset</Button.Label>
            </Button>
          ),
        }}
      />

      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pt-1 pb-28 gap-4"
      >
        <Description>Log your daily wellness</Description>

        {METRIC_KEYS.map((key) => (
          <View key={key}>
            {key === "mood" ? (
              <MoodCard value={getEntry(entries, todayStr).mood} todayStr={todayStr} />
            ) : (
              <NumericCard metric={key} todayStr={todayStr} entries={entries} goals={goals} />
            )}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

function NumericCard({
  metric,
  todayStr,
  entries,
  goals,
}: {
  metric: MetricKey;
  todayStr: string;
  entries: Record<string, DailyEntry>;
  goals: Goals;
}) {
  const config = METRIC_CONFIG[metric];
  const entry = getEntry(entries, todayStr);
  const value = entry[metric];
  const goal = goals[metric];
  const pct = Math.round(Math.min(goal > 0 ? value / goal : 0, 1) * 100);
  const mc = METRIC_TW[metric];
  const surface = "rounded-[22px] border border-foreground/10 bg-foreground/[0.03]";

  return (
    <Card className={surface}>
      <Card.Body className="p-4 gap-4">
        <View className="flex-row items-center gap-3">
          <View
            className={`w-11 h-11 rounded-[12px] items-center justify-center ${mc.bg10}`}
            style={{ borderCurve: "continuous" }}
          >
            <AppIcon name={config.icon} color={config.color} size={18} />
          </View>

          <View className="flex-1 gap-0.5">
            <Card.Title className="text-[15px]">{config.label}</Card.Title>
            <Description className="text-[12px]">
              Goal: {goal} {config.unit}
            </Description>
          </View>

          <Text className={`text-[14px] font-bold tabular-nums ${pct > 0 ? mc.text : "text-muted"}`}>
            {pct}%
          </Text>
        </View>

        <View className={`h-[6px] rounded-full ${mc.bg10}`}>
          <View className={`h-[6px] rounded-full ${mc.bg}`} style={{ width: `${pct}%` }} />
        </View>

        <View className="flex-row items-center justify-between">
          <Button
            size="md"
            variant="ghost"
            isIconOnly
            onPress={() => {
              decrementMetric(todayStr, metric);
            }}
            isDisabled={value <= config.min}
            accessibilityLabel={`Decrease ${config.label}`}
            className={`w-12 h-12 rounded-[14px] ${mc.bg10}`}
          >
            <Button.Label className={`text-[24px] leading-none font-bold ${mc.text}`}>−</Button.Label>
          </Button>

          <View className="items-center min-w-[84px]">
            <Text className={numericText({ size: "xl" })}>{value}</Text>
            <Description className="text-[13px]">{config.unit}</Description>
          </View>

          <Button
            size="md"
            variant="ghost"
            isIconOnly
            onPress={() => {
              incrementMetric(todayStr, metric);
            }}
            isDisabled={value >= config.max}
            accessibilityLabel={`Increase ${config.label}`}
            className={`w-12 h-12 rounded-[14px] ${mc.bg}`}
          >
            <Button.Label className="text-[24px] leading-none font-bold text-white">+</Button.Label>
          </Button>
        </View>
      </Card.Body>
    </Card>
  );
}

function MoodCard({ value, todayStr }: { value: number; todayStr: string }) {
  const config = METRIC_CONFIG.mood;
  const mc = METRIC_TW.mood;
  const surface = "rounded-[22px] border border-foreground/10 bg-foreground/[0.03]";

  return (
    <Card className={surface}>
      <Card.Body className="p-4 gap-4">
        <View className="flex-row items-center gap-3">
          <View
            className={`w-11 h-11 rounded-[12px] items-center justify-center ${mc.bg10}`}
            style={{ borderCurve: "continuous" }}
          >
            <AppIcon name={config.icon} color={config.color} size={18} />
          </View>

          <View className="gap-0.5">
            <Card.Title className="text-[15px]">How are you feeling?</Card.Title>
            <Description className="text-[12px]">
              {value > 0 ? `${MOOD_LABELS[value]} ${MOOD_EMOJIS[value]}` : "Tap to log your mood"}
            </Description>
          </View>
        </View>

        <View className="flex-row items-start justify-between">
          {[1, 2, 3, 4, 5].map((mood) => (
            <Pressable
              key={mood}
              onPress={() => {
                updateMetric(todayStr, "mood", mood);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Mood ${MOOD_LABELS[mood]}`}
              className="items-center gap-1"
            >
              <View
                className={`w-12 h-12 rounded-[14px] items-center justify-center ${
                  value === mood ? `${mc.bg10} border-2 ${mc.border}` : "bg-muted/30"
                }`}
              >
                <Text className="text-[25px]">{MOOD_EMOJIS[mood]}</Text>
              </View>
              <Description className="text-[10px]">{MOOD_LABELS[mood]}</Description>
            </Pressable>
          ))}
        </View>
      </Card.Body>
    </Card>
  );
}
