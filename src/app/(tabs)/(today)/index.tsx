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
import { BG, TEXT } from "@/constants/colors";
import {
  useWellnessStore,
  getEntry,
  getProgress,
  getStreak,
  getCompletionRate,
  incrementMetric,
} from "@/store/wellness-store";
import {
  card,
  caption,
  heading,
  label,
  statLabel,
  statValue,
  sectionHeader,
  sectionTitle,
  sectionSubtitle,
  scrollContent,
  iconBadge,
  row,
  BORDER_CURVE,
} from "@/lib/styles";

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
      contentContainerClassName={scrollContent()}
    >
      {/* Date */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text className={caption({ className: "mt-1" })}>{dateLabel}</Text>
      </Animated.View>

      {/* Summary Card */}
      <Animated.View entering={FadeInDown.duration(400).delay(50)}>
        <View className={card({ size: "md" })} style={BORDER_CURVE}>
          <View className={row({ gap: "lg" })}>
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
            <View className="flex-1 gap-0.5">
              <Text className={heading()}>{greeting}</Text>
              <Text className={caption()}>
                {completed}/{METRIC_KEYS.length} goals met today
              </Text>
              <View className={row({ gap: "lg", className: "mt-2" })}>
                <View>
                  <Text className={statLabel()}>Weekly</Text>
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
                  <Text className={statLabel()}>Best Streak</Text>
                  <Text className={statValue()}>
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
        <View className={card({ size: "sm" })} style={BORDER_CURVE}>
          <View className={row({ justify: "around", className: "py-3.5" })}>
            {METRIC_KEYS.map((key) => {
              const config = METRIC_CONFIG[key];
              const streak = getStreak(entries, goals, key);
              return (
                <View key={key} className="items-center gap-1 py-0.5">
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
                  <Text className={statLabel({ className: "text-[10px]" })}>
                    streak
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </Animated.View>

      {/* Section Header */}
      <View className={sectionHeader()}>
        <Text className={sectionTitle()}>Today&apos;s Metrics</Text>
        <Text className={sectionSubtitle()}>Tap + to quick-add</Text>
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
            <View className={card({ size: "md", className: "p-4" })} style={BORDER_CURVE}>
              <View className={row({ gap: "lg", className: "gap-3.5" })}>
                <View className="items-center">
                  <View
                    className={iconBadge({ size: "md" })}
                    style={{
                      ...BORDER_CURVE,
                      backgroundColor: config.color + "18",
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
                <View className="flex-1">
                  <Text className={label()}>{config.label}</Text>
                  <View className={row({ gap: "sm", className: "items-baseline" })}>
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
                    <Text className={statLabel()}>{unit}</Text>
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
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{
                    ...BORDER_CURVE,
                    backgroundColor: config.color + "18",
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
