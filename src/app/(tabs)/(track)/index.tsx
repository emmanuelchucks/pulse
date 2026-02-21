import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";

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
import {
  card,
  caption,
  heading,
  statLabel,
  row,
  iconBadge,
  stepperButton,
  scrollContent,
  numericDisplay,
  METRIC_CLASSES,
} from "@/lib/styles";
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
            <Pressable
              onPress={handleReset}
              accessibilityRole="button"
              accessibilityLabel="Reset Day"
              className="h-8 px-3 rounded-xl items-center justify-center bg-red-500/12"
            >
              <View className="flex-row items-center gap-1.5">
                <AppIcon
                  name={{ ios: "arrow.counterclockwise", android: "restart_alt", web: "restart_alt" }}
                  color="#ff3b30"
                  size={13}
                />
                <Text className="text-[12px] font-semibold text-sf-red">Reset</Text>
              </View>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        className="flex-1 bg-sf-bg-grouped"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerClassName={scrollContent()}
      >
        <View className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Text className={caption()}>Log your daily wellness</Text>
        </View>

        {METRIC_KEYS.map((key) => (
          <View key={key} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
  const mc = METRIC_CLASSES[metric];

  return (
    <View className={card({ size: "md" })}>
      <View className={row({ gap: "md" })}>
        <View className={iconBadge({ size: "sm", className: mc.bg10 })}>
          <AppIcon name={config.icon} color={config.color} size={18} />
        </View>
        <View className="flex-1">
          <Text className={heading({ className: "text-[15px]" })}>{config.label}</Text>
          <Text className={statLabel()}>
            Goal: {goal} {config.unit}
          </Text>
        </View>
        <Text
          className={`text-[13px] font-bold tabular-nums ${pct > 0 ? mc.text : "text-sf-gray"}`}
        >
          {pct}%
        </Text>
      </View>

      <View className={`h-[5px] rounded-[3px] mt-[14px] ${mc.bg10}`}>
        <View className={`h-[5px] rounded-[3px] ${mc.bg}`} style={{ width: `${pct}%` }} />
      </View>

      <View className={row({ justify: "center", className: "gap-6 mt-[18px]" })}>
        <Pressable
          onPress={() => {
            decrementMetric(todayStr, metric);
          }}
          disabled={value <= config.min}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${config.label}`}
          className={stepperButton({
            size: "md",
            className: `${mc.bg10} ${value <= config.min ? "opacity-30" : "opacity-100"}`,
          })}
        >
          <Text className={`text-[22px] font-bold ${mc.text}`}>−</Text>
        </Pressable>

        <View className="items-center min-w-[72px]">
          <Text className={numericDisplay({ size: "xl" })} selectable>
            {value}
          </Text>
          <Text className="text-[13px] text-sf-text-3">{config.unit}</Text>
        </View>

        <Pressable
          onPress={() => {
            incrementMetric(todayStr, metric);
          }}
          disabled={value >= config.max}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${config.label}`}
          className={stepperButton({
            size: "md",
            className: `${mc.bg} ${value >= config.max ? "opacity-30" : "opacity-100"}`,
          })}
        >
          <Text className="text-[22px] font-bold text-white">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MoodCard({ value, todayStr }: { value: number; todayStr: string }) {
  const config = METRIC_CONFIG.mood;
  const mc = METRIC_CLASSES.mood;

  return (
    <View className={card({ size: "md" })}>
      <View className={row({ gap: "md" })}>
        <View className={iconBadge({ size: "sm", className: mc.bg10 })}>
          <AppIcon name={config.icon} color={config.color} size={18} />
        </View>
        <View>
          <Text className={heading({ className: "text-[15px]" })}>How are you feeling?</Text>
          <Text className={statLabel()}>
            {value > 0 ? `${MOOD_LABELS[value]} ${MOOD_EMOJIS[value]}` : "Tap to log your mood"}
          </Text>
        </View>
      </View>

      <View className={row({ justify: "around", className: "mt-4" })}>
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
              className={`w-[52px] h-[52px] rounded-2xl items-center justify-center ${
                value === mood ? `${mc.bg10} border-2 ${mc.border}` : ""
              }`}
            >
              <Text className="text-[26px]">{MOOD_EMOJIS[mood]}</Text>
            </View>
            <Text className={statLabel({ className: "text-[10px]" })}>{MOOD_LABELS[mood]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
