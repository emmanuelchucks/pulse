import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";

import { Button, Card, Description } from "heroui-native";

import type { MetricKey } from "@/constants/metrics";
import type { DailyEntry, Goals } from "@/db/types";

import { AppIcon } from "@/components/ui/app-icon";
import {
  METRIC_CONFIG,
  METRIC_KEYS,
  MOOD_EMOJIS,
  MOOD_LABELS,
  formatDate,
} from "@/constants/metrics";
import { getEntry } from "@/features/wellness/domain/analytics";
import { iconBadge, METRIC_TW, numericText, panel, stepperButton } from "@/lib/metric-theme";
import {
  decrementMetric,
  incrementMetric,
  resetDay,
  updateMetric,
  useWellnessStore,
} from "@/store/wellness-store";

const RESET_ICON = {
  ios: "arrow.counterclockwise",
  android: "restart_alt",
  web: "restart_alt",
} as const;
const PLUS_ICON = { ios: "plus", android: "add", web: "add" } as const;
const MINUS_ICON = { ios: "minus", android: "remove", web: "remove" } as const;

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
              variant="ghost"
              onPress={handleReset}
              accessibilityLabel="Reset Day"
              className="h-9 rounded-full px-3 border border-red-500/60 bg-red-500/20"
            >
              <AppIcon name={RESET_ICON} color="#fb7185" size={14} />
              <Button.Label className="text-red-300">Reset</Button.Label>
            </Button>
          ),
        }}
      />

      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pt-1 pb-20 gap-4"
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
  const cardStyles = panel();

  return (
    <Card className={cardStyles.base()}>
      <Card.Body className={cardStyles.body({ className: "gap-4" })}>
        <View className="flex-row items-center gap-3">
          <View className={`${iconBadge()} ${mc.bg10}`}>
            <AppIcon name={config.icon} color={config.color} size={18} />
          </View>

          <View className="flex-1 gap-0.5">
            <Card.Title className="text-lg">{config.label}</Card.Title>
            <Description>
              Goal: {goal} {config.unit}
            </Description>
          </View>

          <Text className={`text-3xl font-bold tabular-nums ${pct > 0 ? mc.text : "text-muted"}`}>
            {pct}%
          </Text>
        </View>

        <View className={`h-1.5 rounded-full ${mc.bg10}`}>
          <View className={`h-1.5 rounded-full ${mc.bg}`} style={{ width: `${pct}%` }} />
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
            className={`${stepperButton({ disabled: value <= config.min })} ${mc.bg10}`}
          >
            <AppIcon name={MINUS_ICON} color={config.color} size={20} />
          </Button>

          <View className="items-center min-w-20">
            <Text className={numericText({ size: "xl" })}>{value}</Text>
            <Description className="text-base">{config.unit}</Description>
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
            className={`${stepperButton({ disabled: value >= config.max })} ${mc.bg}`}
          >
            <AppIcon name={PLUS_ICON} color="#ffffff" size={20} />
          </Button>
        </View>
      </Card.Body>
    </Card>
  );
}

function MoodCard({ value, todayStr }: { value: number; todayStr: string }) {
  const config = METRIC_CONFIG.mood;
  const mc = METRIC_TW.mood;
  const cardStyles = panel();

  return (
    <Card className={cardStyles.base()}>
      <Card.Body className={cardStyles.body({ className: "gap-4" })}>
        <View className="flex-row items-center gap-3">
          <View className={`${iconBadge()} ${mc.bg10}`}>
            <AppIcon name={config.icon} color={config.color} size={18} />
          </View>

          <View className="gap-0.5">
            <Card.Title className="text-lg">How are you feeling?</Card.Title>
            <Description>
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
                className={`size-12 rounded-2xl items-center justify-center ${
                  value === mood ? `${mc.bg10} border-2 ${mc.border}` : "bg-muted/40"
                }`}
              >
                <Text className="text-3xl">{MOOD_EMOJIS[mood]}</Text>
              </View>
              <Description className="text-sm">{MOOD_LABELS[mood]}</Description>
            </Pressable>
          ))}
        </View>
      </Card.Body>
    </Card>
  );
}
