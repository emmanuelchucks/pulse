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
  scrollContainer,
  sectionHeader,
  text,
  iconBox,
  controlButton,
  row,
  statCell,
} from "@/lib/styles";

const sc = scrollContainer();
const sh = sectionHeader();

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
      className={sc.root()}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName={sc.content()}
    >
      {/* Date */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text className={text({ variant: "body" })} style={{ marginTop: 4 }}>
          {dateLabel}
        </Text>
      </Animated.View>

      {/* Summary Card */}
      <Animated.View entering={FadeInDown.duration(400).delay(50)}>
        <View className={card()}>
          <View className={row({ gap: "lg" })}>
            <View
              className={iconBox({ size: "lg" })}
              style={{
                borderWidth: 5,
                borderColor: overall >= 100 ? "#34d399" : "#0a84ff",
              }}
            >
              <Text className={text({ variant: "heading" })} style={{ fontWeight: "800", fontVariant: ["tabular-nums"] }}>
                {overall}%
              </Text>
            </View>
            <View className="flex-1 gap-0.5">
              <Text className={text({ variant: "heading" })}>{greeting}</Text>
              <Text className={text({ variant: "body" })}>
                {completed}/{METRIC_KEYS.length} goals met today
              </Text>
              <View className={row({ gap: "lg" })} style={{ marginTop: 8 }}>
                <View>
                  <Text className={text({ variant: "caption" })}>Weekly</Text>
                  <Text className={text({ variant: "value" })}>{weeklyRate}%</Text>
                </View>
                <View>
                  <Text className={text({ variant: "caption" })}>Best Streak</Text>
                  <Text className={text({ variant: "value" })}>
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
        <View className={card({ size: "flush" })}>
          <View className={row({ justify: "around" })} style={{ paddingVertical: 14 }}>
            {METRIC_KEYS.map((key) => {
              const config = METRIC_CONFIG[key];
              const streak = getStreak(entries, goals, key);
              return (
                <View key={key} className={statCell()}>
                  <SymbolView
                    name={config.icon}
                    tintColor={config.color}
                    style={{ width: 16, height: 16 }}
                  />
                  <Text className={text({ variant: "value" })} style={{ fontWeight: "700" }} selectable>
                    {streak}
                  </Text>
                  <Text className={text({ variant: "tiny" })}>streak</Text>
                </View>
              );
            })}
          </View>
        </View>
      </Animated.View>

      {/* Section Header */}
      <View className={sh.wrapper()}>
        <Text className={sh.title()} style={{ fontSize: 20 }}>
          Today&apos;s Metrics
        </Text>
        <Text className={sh.subtitle()}>Tap + to quick-add</Text>
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
            <View className={card()}>
              <View className={row({ gap: "md" })} style={{ gap: 14 }}>
                <View className="items-center">
                  <View
                    className={iconBox({ size: "md" })}
                    style={{ backgroundColor: config.color + "18" }}
                  >
                    <SymbolView
                      name={config.icon}
                      tintColor={config.color}
                      style={{ width: 22, height: 22 }}
                    />
                  </View>
                  <View
                    className="rounded-sm"
                    style={{
                      width: 40,
                      height: 4,
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
                  <Text className="text-[13px] font-medium text-sf-text-2">
                    {config.label}
                  </Text>
                  <View className="flex-row items-baseline gap-1">
                    <Text className={text({ variant: "valueLg" })} selectable>
                      {display}
                    </Text>
                    <Text className={text({ variant: "caption" })}>{unit}</Text>
                  </View>
                </View>
                {key !== "mood" ? (
                  <Pressable
                    onPress={() => {
                      if (process.env.EXPO_OS === "ios") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }
                      incrementMetric(todayStr, key);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Quick add ${config.label}`}
                    className={controlButton({ size: "md" })}
                    style={{ backgroundColor: config.color + "18" }}
                  >
                    <Text
                      className="text-xl font-bold"
                      style={{ color: config.color }}
                    >
                      +
                    </Text>
                  </Pressable>
                ) : null}
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
