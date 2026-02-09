import { ScrollView, View, Text, Pressable, Alert } from "react-native";
import { Stack } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  MetricKey,
  METRIC_KEYS,
  METRIC_CONFIG,
  MOOD_EMOJIS,
  MOOD_LABELS,
  formatDate,
} from "@/constants/metrics";
import {
  useWellnessStore,
  DailyEntry,
  Goals,
  getEntry,
  incrementMetric,
  decrementMetric,
  updateMetric,
  resetDay,
} from "@/store/wellness-store";
import {
  card,
  scrollContainer,
  text,
  iconBox,
  controlButton,
  row,
} from "@/lib/styles";

const sc = scrollContainer();

function haptic(style = Haptics.ImpactFeedbackStyle.Medium) {
  if (process.env.EXPO_OS === "ios") Haptics.impactAsync(style);
}

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
          if (process.env.EXPO_OS === "ios")
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
            <Pressable onPress={handleReset} accessibilityLabel="Reset Day">
              <Text className="text-[13px] font-semibold text-sf-red">
                Reset
              </Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        className={sc.root()}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName={sc.content()}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text className={text({ variant: "body" })}>
            Log your daily wellness
          </Text>
        </Animated.View>

        {METRIC_KEYS.map((key, i) => (
          <Animated.View
            key={key}
            entering={FadeInDown.duration(400).delay(50 + i * 50)}
          >
            {key === "mood" ? (
              <MoodCard
                value={getEntry(entries, todayStr).mood}
                todayStr={todayStr}
              />
            ) : (
              <NumericCard
                metric={key}
                todayStr={todayStr}
                entries={entries}
                goals={goals}
              />
            )}
          </Animated.View>
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

  return (
    <View className={card()}>
      {/* Header */}
      <View className={row({ gap: "md" })}>
        <View
          className={iconBox()}
          style={{ backgroundColor: config.color + "20" }}
        >
          <SymbolView
            name={config.icon}
            tintColor={config.color}
            style={{ width: 18, height: 18 }}
          />
        </View>
        <View className="flex-1">
          <Text className={text({ variant: "title" })}>{config.label}</Text>
          <Text className={text({ variant: "caption" })}>
            Goal: {goal} {config.unit}
          </Text>
        </View>
        <Text
          className="text-[13px] font-bold tabular-nums"
          style={{ color: pct > 0 ? config.color : "#8e8e93" }}
        >
          {pct}%
        </Text>
      </View>

      {/* Progress bar */}
      <View
        className="rounded-sm"
        style={{
          height: 5,
          backgroundColor: config.color + "20",
          marginTop: 14,
        }}
      >
        <View
          style={{
            width: `${pct}%` as unknown as number,
            height: 5,
            borderRadius: 3,
            backgroundColor: config.color,
          }}
        />
      </View>

      {/* Controls */}
      <View className={row({ justify: "center" })} style={{ gap: 24, marginTop: 18 }}>
        <Pressable
          onPress={() => {
            haptic(Haptics.ImpactFeedbackStyle.Light);
            decrementMetric(todayStr, metric);
          }}
          disabled={value <= config.min}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${config.label}`}
          className={controlButton({ size: "lg" })}
          style={{
            backgroundColor: config.color + "15",
            opacity: value <= config.min ? 0.3 : 1,
          }}
        >
          <Text
            className="text-[22px] font-bold"
            style={{ color: config.color }}
          >
            −
          </Text>
        </Pressable>

        <View className="items-center min-w-[72px]">
          <Text className={text({ variant: "valueXl" })} selectable>
            {value}
          </Text>
          <Text className={text({ variant: "body" })}>{config.unit}</Text>
        </View>

        <Pressable
          onPress={() => {
            haptic();
            incrementMetric(todayStr, metric);
          }}
          disabled={value >= config.max}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${config.label}`}
          className={controlButton({ size: "lg" })}
          style={{
            backgroundColor: config.color,
            opacity: value >= config.max ? 0.3 : 1,
          }}
        >
          <Text className="text-[22px] font-bold text-white">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MoodCard({ value, todayStr }: { value: number; todayStr: string }) {
  const config = METRIC_CONFIG.mood;

  return (
    <View className={card()}>
      <View className={row({ gap: "md" })}>
        <View
          className={iconBox()}
          style={{ backgroundColor: config.color + "20" }}
        >
          <SymbolView
            name={config.icon}
            tintColor={config.color}
            style={{ width: 18, height: 18 }}
          />
        </View>
        <View>
          <Text className={text({ variant: "title" })}>
            How are you feeling?
          </Text>
          <Text className={text({ variant: "caption" })}>
            {value > 0
              ? `${MOOD_LABELS[value]} ${MOOD_EMOJIS[value]}`
              : "Tap to log your mood"}
          </Text>
        </View>
      </View>

      <View className={row({ justify: "around" })} style={{ marginTop: 16 }}>
        {[1, 2, 3, 4, 5].map((mood) => (
          <Pressable
            key={mood}
            onPress={() => {
              haptic();
              updateMetric(todayStr, "mood", mood);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Mood ${MOOD_LABELS[mood]}`}
            className="items-center gap-1"
          >
            <View
              className="w-[52px] h-[52px] rounded-2xl items-center justify-center"
              style={{
                backgroundColor:
                  value === mood ? config.color + "20" : "transparent",
                borderWidth: value === mood ? 2 : 0,
                borderColor: config.color,
              }}
            >
              <Text className="text-[26px]">{MOOD_EMOJIS[mood]}</Text>
            </View>
            <Text className={text({ variant: "tiny" })}>
              {MOOD_LABELS[mood]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
