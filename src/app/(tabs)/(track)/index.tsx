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
import { BG, CARD_BG, TEXT, TEXT_2, TEXT_3 } from "@/constants/colors";
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

const CARD = {
  borderRadius: 20,
  borderCurve: "continuous" as const,
  overflow: "hidden" as const,
  padding: 20,
  backgroundColor: CARD_BG,
};

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
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#ff453a" }}>
                Reset
              </Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: BG }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          gap: 12,
        }}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={{ fontSize: 13, color: TEXT_2 }}>
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
    <View style={CARD}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            borderCurve: "continuous",
            backgroundColor: config.color + "20",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SymbolView
            name={config.icon}
            tintColor={config.color}
            style={{ width: 18, height: 18 }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: TEXT }}>
            {config.label}
          </Text>
          <Text style={{ fontSize: 11, color: TEXT_3 }}>
            Goal: {goal} {config.unit}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            fontVariant: ["tabular-nums"],
            color: pct > 0 ? config.color : "#8e8e93",
          }}
        >
          {pct}%
        </Text>
      </View>

      {/* Progress bar */}
      <View
        style={{
          height: 5,
          borderRadius: 3,
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          marginTop: 18,
        }}
      >
        <Pressable
          onPress={() => {
            haptic(Haptics.ImpactFeedbackStyle.Light);
            decrementMetric(todayStr, metric);
          }}
          disabled={value <= config.min}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${config.label}`}
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            borderCurve: "continuous",
            backgroundColor: config.color + "15",
            alignItems: "center",
            justifyContent: "center",
            opacity: value <= config.min ? 0.3 : 1,
          }}
        >
          <Text
            style={{ fontSize: 22, fontWeight: "700", color: config.color }}
          >
            −
          </Text>
        </Pressable>

        <View style={{ alignItems: "center", minWidth: 72 }}>
          <Text
            style={{
              fontSize: 31.5,
              fontWeight: "800",
              fontVariant: ["tabular-nums"],
              color: TEXT,
            }}
            selectable
          >
            {value}
          </Text>
          <Text style={{ fontSize: 13, color: TEXT_3 }}>{config.unit}</Text>
        </View>

        <Pressable
          onPress={() => {
            haptic();
            incrementMetric(todayStr, metric);
          }}
          disabled={value >= config.max}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${config.label}`}
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            borderCurve: "continuous",
            backgroundColor: config.color,
            alignItems: "center",
            justifyContent: "center",
            opacity: value >= config.max ? 0.3 : 1,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
            +
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function MoodCard({ value, todayStr }: { value: number; todayStr: string }) {
  const config = METRIC_CONFIG.mood;

  return (
    <View style={CARD}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            borderCurve: "continuous",
            backgroundColor: config.color + "20",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SymbolView
            name={config.icon}
            tintColor={config.color}
            style={{ width: 18, height: 18 }}
          />
        </View>
        <View>
          <Text style={{ fontSize: 15, fontWeight: "600", color: TEXT }}>
            How are you feeling?
          </Text>
          <Text style={{ fontSize: 11, color: TEXT_3 }}>
            {value > 0
              ? `${MOOD_LABELS[value]} ${MOOD_EMOJIS[value]}`
              : "Tap to log your mood"}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          marginTop: 16,
        }}
      >
        {[1, 2, 3, 4, 5].map((mood) => (
          <Pressable
            key={mood}
            onPress={() => {
              haptic();
              updateMetric(todayStr, "mood", mood);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Mood ${MOOD_LABELS[mood]}`}
            style={{ alignItems: "center", gap: 4 }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                borderCurve: "continuous",
                backgroundColor:
                  value === mood ? config.color + "20" : "transparent",
                borderWidth: value === mood ? 2 : 0,
                borderColor: config.color,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 26 }}>{MOOD_EMOJIS[mood]}</Text>
            </View>
            <Text style={{ fontSize: 10, color: TEXT_3 }}>
              {MOOD_LABELS[mood]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
