import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import { Card, Description } from "heroui-native";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import type { MetricKey } from "@/constants/metrics";
import { AppIcon } from "@/components/ui/app-icon";
import { StepperGlyph } from "@/components/ui/stepper-glyph";
import {
  METRIC_CONFIG,
  METRIC_KEYS,
  MOOD_EMOJIS,
  MOOD_LABELS,
  formatDate,
} from "@/constants/metrics";
import { iconBadge, METRIC_TW, numericText, panel, stepperButton } from "@/lib/metric-theme";
import { showSaveErrorAlert } from "@/lib/save-error-alert";
import {
  decrementMetric,
  incrementMetric,
  resetDay,
  updateMetric,
  useEntryByDate,
  useGoals,
} from "@/store/wellness-store";

const RESET_ICON = {
  ios: "arrow.counterclockwise",
  android: "restart_alt",
  web: "restart_alt",
} as const;

export default function TrackScreen() {
  const goals = useGoals();
  const todayStr = formatDate(new Date());
  const todayEntry = useEntryByDate(todayStr);

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
          if (!resetDay(todayStr)) {
            showSaveErrorAlert();
          }
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={handleReset}
              accessibilityRole="button"
              accessibilityLabel="Reset Day"
              className="h-9 items-center justify-center rounded-full border border-red-500/15 bg-red-500/6 px-4"
            >
              <View className="flex-row items-center justify-center gap-1.5">
                <AppIcon name={RESET_ICON} color="#fca5a5" size={14} />
                <Text className="text-[17px] font-semibold text-red-500/70 dark:text-red-300">
                  Reset
                </Text>
              </View>
            </Pressable>
          ),
        }}
      />

      <ScrollView
        className="bg-background flex-1"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pt-2 pb-10 gap-4"
      >
        <Description>Log your daily wellness</Description>

        {METRIC_KEYS.map((key) => (
          <View key={key}>
            {key === "mood" ? (
              <MoodCard value={todayEntry.mood} todayStr={todayStr} />
            ) : (
              <NumericCard
                metric={key}
                todayStr={todayStr}
                value={todayEntry[key]}
                goal={goals[key]}
              />
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
  value,
  goal,
}: {
  metric: MetricKey;
  todayStr: string;
  value: number;
  goal: number;
}) {
  const config = METRIC_CONFIG[metric];
  const pct = Math.round(Math.min(goal > 0 ? value / goal : 0, 1) * 100);
  const mc = METRIC_TW[metric];
  const cardStyles = panel();

  return (
    <Card className={cardStyles.base()}>
      <Card.Body className={cardStyles.body({ className: "gap-2.5 px-4 py-3" })}>
        <View className="flex-row items-start gap-3">
          <View className={`${iconBadge()} ${mc.bg10} mt-0.5`}>
            <AppIcon name={config.icon} color={config.color} size={18} />
          </View>

          <View className="flex-1 gap-0.5">
            <Card.Title className="text-lg">{config.label}</Card.Title>
            <Description>
              Goal: {goal} {config.unit}
            </Description>
          </View>

          <Text className={`text-2xl font-bold tabular-nums ${pct > 0 ? mc.text : "text-muted"}`}>
            {pct}%
          </Text>
        </View>

        <View className={`h-1.5 rounded-full ${mc.bg10} mt-1.5`}>
          <View className={`h-1.5 rounded-full ${mc.bg}`} style={{ width: `${pct}%` }} />
        </View>

        <View className="flex-row items-center justify-between pt-1.5">
          <Pressable
            onPress={() => {
              if (!decrementMetric(todayStr, metric)) {
                showSaveErrorAlert();
              }
            }}
            disabled={value <= config.min}
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${config.label}`}
            className={`${stepperButton({ disabled: value <= config.min })} ${mc.bg10}`}
          >
            <StepperGlyph kind="minus" color={config.color} />
          </Pressable>

          <View className="min-w-20 items-center">
            <Text className={numericText({ size: "md" })}>{value}</Text>
            <Description>{config.unit}</Description>
          </View>

          <Pressable
            onPress={() => {
              if (!incrementMetric(todayStr, metric)) {
                showSaveErrorAlert();
              }
            }}
            disabled={value >= config.max}
            accessibilityRole="button"
            accessibilityLabel={`Increase ${config.label}`}
            className={`${stepperButton({ disabled: value >= config.max })} ${mc.bg}`}
          >
            <StepperGlyph kind="plus" color="#ffffff" />
          </Pressable>
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
      <Card.Body className={cardStyles.body({ className: "gap-2.5 px-4 py-3" })}>
        <View className="flex-row items-start gap-3">
          <View className={`${iconBadge()} ${mc.bg10} mt-0.5`}>
            <AppIcon name={config.icon} color={config.color} size={18} />
          </View>

          <View className="gap-0.5">
            <Card.Title className="text-lg">How are you feeling?</Card.Title>
            <Description>
              {value > 0 ? `${MOOD_LABELS[value]} ${MOOD_EMOJIS[value]}` : "Tap to log your mood"}
            </Description>
          </View>
        </View>

        <View className="flex-row items-start justify-between pt-0.5">
          {[1, 2, 3, 4, 5].map((mood) => (
            <Pressable
              key={mood}
              onPress={() => {
                if (!updateMetric(todayStr, "mood", mood)) {
                  showSaveErrorAlert();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={`Mood ${MOOD_LABELS[mood]}`}
              className="items-center gap-1"
            >
              <View
                className={`size-11 items-center justify-center rounded-2xl border-2 ${
                  value === mood ? `${mc.bg10} ${mc.border}` : "bg-foreground/5 border-transparent"
                }`}
              >
                <Text className="text-2xl">{MOOD_EMOJIS[mood]}</Text>
              </View>
              <Description className="text-sm">{MOOD_LABELS[mood]}</Description>
            </Pressable>
          ))}
        </View>
      </Card.Body>
    </Card>
  );
}
