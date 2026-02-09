import { ScrollView, View, Text, Pressable } from "react-native";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  METRIC_KEYS,
  METRIC_CONFIG,
  MOOD_EMOJIS,
  formatDate,
} from "@/constants/metrics";
import { BG, CARD_BG, TEXT, TEXT_2, TEXT_3 } from "@/constants/colors";
import {
  useWellnessStore,
  getEntry,
  getProgress,
  getStreak,
  getCompletionRate,
  incrementMetric,
} from "@/store/wellness-store";

const CARD = {
  borderRadius: 20,
  borderCurve: "continuous" as const,
  backgroundColor: CARD_BG,
};
const CARD_SM = {
  borderRadius: 16,
  borderCurve: "continuous" as const,
  backgroundColor: CARD_BG,
};

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
    getProgress(entries, goals, todayStr, k)
  );
  const overall = Math.round(
    (progresses.reduce((a, b) => a + b, 0) / progresses.length) * 100
  );
  const completed = progresses.filter((p) => p >= 1).length;
  const weeklyRate = Math.round(getCompletionRate(entries, goals, 7) * 100);
  const bestStreak = Math.max(
    ...METRIC_KEYS.map((k) => getStreak(entries, goals, k))
  );
  const greeting = getGreeting();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 12,
      }}
    >
      {/* Date */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={{ fontSize: 13, marginTop: 4, color: TEXT_2 }}>
          {dateLabel}
        </Text>
      </Animated.View>

      {/* Summary Card */}
      <Animated.View entering={FadeInDown.duration(400).delay(50)}>
        <View style={{ ...CARD, overflow: "hidden", padding: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
            }}
          >
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                borderWidth: 5,
                borderColor: overall >= 100 ? "#34d399" : "#0a84ff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "800",
                  fontVariant: ["tabular-nums"],
                  color: TEXT,
                }}
              >
                {overall}%
              </Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={{ fontSize: 17, fontWeight: "700", color: TEXT }}
              >
                {greeting}
              </Text>
              <Text style={{ fontSize: 13, color: TEXT_2 }}>
                {completed}/{METRIC_KEYS.length} goals met today
              </Text>
              <View style={{ flexDirection: "row", gap: 20, marginTop: 8 }}>
                <View>
                  <Text style={{ fontSize: 11, color: TEXT_3 }}>Weekly</Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      fontVariant: ["tabular-nums"],
                      color: TEXT,
                    }}
                  >
                    {weeklyRate}%
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: 11, color: TEXT_3 }}>
                    Best Streak
                  </Text>
                  <Text
                    style={{ fontSize: 13, fontWeight: "600", color: TEXT }}
                  >
                    {bestStreak} {bestStreak === 1 ? "day" : "days"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Streak Row */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <View style={CARD_SM}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              paddingVertical: 14,
            }}
          >
            {METRIC_KEYS.map((key) => {
              const config = METRIC_CONFIG[key];
              const streak = getStreak(entries, goals, key);
              return (
                <View
                  key={key}
                  style={{ alignItems: "center", gap: 4, paddingVertical: 2 }}
                >
                  <SymbolView
                    name={config.icon}
                    tintColor={config.color}
                    style={{ width: 16, height: 16 }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      fontVariant: ["tabular-nums"],
                      color: TEXT,
                    }}
                    selectable
                  >
                    {streak}
                  </Text>
                  <Text style={{ fontSize: 10, color: TEXT_3 }}>streak</Text>
                </View>
              );
            })}
          </View>
        </View>
      </Animated.View>

      {/* Section Header */}
      <View style={{ paddingHorizontal: 4, marginTop: 4 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", color: TEXT }}>
          Today&apos;s Metrics
        </Text>
        <Text style={{ fontSize: 13, marginTop: 2, color: TEXT_2 }}>
          Tap + to quick-add
        </Text>
      </View>

      {/* Metric Cards */}
      {METRIC_KEYS.map((key, i) => {
        const config = METRIC_CONFIG[key];
        const entry = getEntry(entries, todayStr);
        const value = entry[key];
        const goal = goals[key];
        const pct = Math.min(goal > 0 ? value / goal : 0, 1);
        const display =
          key === "mood" && value > 0 ? MOOD_EMOJIS[value] : `${value}`;
        const unit = key === "mood" ? "" : `/${goal} ${config.unit}`;

        return (
          <Animated.View
            key={key}
            entering={FadeInDown.duration(400).delay(150 + i * 50)}
          >
            <View style={{ ...CARD, overflow: "hidden", padding: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      borderCurve: "continuous",
                      backgroundColor: config.color + "18",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SymbolView
                      name={config.icon}
                      tintColor={config.color}
                      style={{ width: 22, height: 22 }}
                    />
                  </View>
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: config.color + "25",
                      marginTop: 6,
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.round(pct * 100)}%` as unknown as number,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: config.color,
                      }}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "500", color: TEXT_2 }}>
                    {config.label}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "baseline",
                      gap: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 21,
                        fontWeight: "800",
                        fontVariant: ["tabular-nums"],
                        color: TEXT,
                      }}
                      selectable
                    >
                      {display}
                    </Text>
                    <Text style={{ fontSize: 11, color: TEXT_3 }}>{unit}</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    if (process.env.EXPO_OS === "ios") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    incrementMetric(todayStr, key);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Quick add ${config.label}`}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    borderCurve: "continuous",
                    backgroundColor: config.color + "18",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: config.color,
                    }}
                  >
                    +
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
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
