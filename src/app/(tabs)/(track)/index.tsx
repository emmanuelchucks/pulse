import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import { Alert, Platform, ScrollView, Text, View } from "react-native";

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
        contentContainerClassName="px-5 pb-10 gap-3"
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

  return (
    <Card>
      <Card.Body>
        <View className="flex-row items-center gap-3">
          <View
            className={`w-[38px] h-[38px] rounded-[11px] items-center justify-center ${mc.bg}/10`}
            style={{ borderCurve: "continuous" }}
          >
            <AppIcon name={config.icon} color={config.color} size={18} />
          </View>
          <View className="flex-1">
            <Card.Title className="text-[15px]">{config.label}</Card.Title>
            <Description className="text-[11px]">
              Goal: {goal} {config.unit}
            </Description>
          </View>
          <Text
            className={`text-[13px] font-bold tabular-nums ${pct > 0 ? mc.text : "text-muted"}`}
          >
            {pct}%
          </Text>
        </View>

        {/* Progress bar */}
        <View className={`h-[5px] rounded-[3px] mt-[14px] ${mc.bg}/10`}>
          <View className={`h-[5px] rounded-[3px] ${mc.bg}`} style={{ width: `${pct}%` }} />
        </View>

        {/* Stepper */}
        <View className="flex-row items-center justify-center gap-6 mt-[18px]">
          <Button
            size="md"
            variant="ghost"
            isIconOnly
            onPress={() => {
              decrementMetric(todayStr, metric);
            }}
            isDisabled={value <= config.min}
            accessibilityLabel={`Decrease ${config.label}`}
            className={`w-12 h-12 rounded-[14px] ${mc.bg}/10`}
          >
            <Button.Label className={`text-[22px] font-bold ${mc.text}`}>−</Button.Label>
          </Button>

          <View className="items-center min-w-[72px]">
            <Text className={numericText({ size: "xl" })} selectable>
              {value}
            </Text>
            <Description className="text-[13px]">{config.unit}</Description>
          </View>

          <Button
            size="md"
            variant="primary"
            isIconOnly
            onPress={() => {
              incrementMetric(todayStr, metric);
            }}
            isDisabled={value >= config.max}
            accessibilityLabel={`Increase ${config.label}`}
            className={`w-12 h-12 rounded-[14px] ${mc.bg}`}
          >
            <Button.Label className="text-[22px] font-bold text-white">+</Button.Label>
          </Button>
        </View>
      </Card.Body>
    </Card>
  );
}

function MoodCard({ value, todayStr }: { value: number; todayStr: string }) {
  const config = METRIC_CONFIG.mood;
  const mc = METRIC_TW.mood;

  return (
    <Card>
      <Card.Body>
        <View className="flex-row items-center gap-3">
          <View
            className={`w-[38px] h-[38px] rounded-[11px] items-center justify-center ${mc.bg}/10`}
            style={{ borderCurve: "continuous" }}
          >
            <AppIcon name={config.icon} color={config.color} size={18} />
          </View>
          <View>
            <Card.Title className="text-[15px]">How are you feeling?</Card.Title>
            <Description className="text-[11px]">
              {value > 0 ? `${MOOD_LABELS[value]} ${MOOD_EMOJIS[value]}` : "Tap to log your mood"}
            </Description>
          </View>
        </View>

        {/* Mood selector */}
        <View className="flex-row items-center justify-around mt-4">
          {[1, 2, 3, 4, 5].map((mood) => (
            <Button
              key={mood}
              variant={value === mood ? "secondary" : "ghost"}
              onPress={() => {
                updateMetric(todayStr, "mood", mood);
              }}
              accessibilityLabel={`Mood ${MOOD_LABELS[mood]}`}
              className={`items-center w-[52px] h-[52px] rounded-2xl ${
                value === mood ? `${mc.bg}/10 border-2 border-mood` : ""
              }`}
            >
              <Text className="text-[26px]">{MOOD_EMOJIS[mood]}</Text>
            </Button>
          ))}
        </View>
        {/* Mood labels below buttons */}
        <View className="flex-row items-center justify-around mt-1">
          {[1, 2, 3, 4, 5].map((mood) => (
            <Description key={mood} className="text-[10px] w-[52px] text-center">
              {MOOD_LABELS[mood]}
            </Description>
          ))}
        </View>
      </Card.Body>
    </Card>
  );
}
