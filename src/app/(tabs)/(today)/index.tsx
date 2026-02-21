import { ScrollView, Text, Pressable, View } from "react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { METRIC_KEYS, METRIC_CONFIG, MOOD_EMOJIS, formatDate } from "@/constants/metrics";
import {
  getEntry,
  getProgress,
  getStreak,
  getCompletionRate,
} from "@/features/wellness/domain/analytics";
import {
  card,
  caption,
  heading,
  label,
  statLabel,
  statValue,
  numericDisplay,
  sectionHeader,
  sectionTitle,
  sectionSubtitle,
  scrollContent,
  iconBadge,
  row,
  METRIC_CLASSES,
} from "@/lib/styles";
import { useWellnessStore, incrementMetric } from "@/store/wellness-store";

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
    getProgress(entries, goals, { dateStr: todayStr, metric: k }),
  );
  const overall = Math.round((progresses.reduce((a, b) => a + b, 0) / progresses.length) * 100);
  const completed = progresses.filter((p) => p >= 1).length;
  const weeklyRate = Math.round(getCompletionRate(entries, goals, { days: 7 }) * 100);
  const bestStreak = Math.max(...METRIC_KEYS.map((k) => getStreak(entries, goals, { metric: k })));
  const greeting = getGreeting();

  return (
    <ScrollView
      className="flex-1 bg-sf-bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerClassName={scrollContent()}
    >
      <View className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Text className={caption({ className: "mt-1" })}>{dateLabel}</Text>
      </View>

      <View className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <View className={card({ size: "md" })}>
          <View className={row({ gap: "lg" })}>
            <View
              className={`size-[76px] rounded-full border-[5px] items-center justify-center ${
                overall >= 100 ? "border-emerald-400" : "border-[#0a84ff]"
              }`}
            >
              <Text className={numericDisplay({ size: "md" })}>{overall}%</Text>
            </View>
            <View className="flex-1 gap-0.5">
              <Text className={heading()}>{greeting}</Text>
              <Text className={caption()}>
                {completed}/{METRIC_KEYS.length} goals met today
              </Text>
              <View className={row({ gap: "lg", className: "mt-2" })}>
                <View>
                  <Text className={statLabel()}>Weekly</Text>
                  <Text className={numericDisplay({ size: "xs", className: "font-semibold" })}>
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
      </View>

      <View className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <View className={card({ size: "sm" })}>
          <View className={row({ justify: "around", className: "py-3.5" })}>
            {METRIC_KEYS.map((key) => {
              const config = METRIC_CONFIG[key];
              const streak = getStreak(entries, goals, { metric: key });
              return (
                <View key={key} className="items-center gap-1 py-0.5">
                  <AppIcon name={config.icon} color={config.color} size={16} />
                  <Text
                    className={numericDisplay({ size: "xs", className: "font-bold" })}
                    selectable
                  >
                    {streak}
                  </Text>
                  <Text className={statLabel({ className: "text-[10px]" })}>streak</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View className={sectionHeader()}>
        <Text className={sectionTitle()}>Today&apos;s Metrics</Text>
        <Text className={sectionSubtitle()}>Tap + to quick-add</Text>
      </View>

      {METRIC_KEYS.map((key) => {
        const config = METRIC_CONFIG[key];
        const mc = METRIC_CLASSES[key];
        const entry = getEntry(entries, todayStr);
        const value = entry[key];
        const goal = goals[key];
        const pct = Math.min(goal > 0 ? value / goal : 0, 1);
        const display = key === "mood" && value > 0 ? MOOD_EMOJIS[value] : `${value}`;
        const unit = key === "mood" ? "" : `/${goal} ${config.unit}`;

        return (
          <View key={key} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <View className={card({ size: "md", className: "p-4" })}>
              <View className={row({ gap: "lg", className: "gap-3.5" })}>
                <View className="items-center">
                  <View className={iconBadge({ size: "md", className: mc.bg10 })}>
                    <AppIcon name={config.icon} color={config.color} size={22} />
                  </View>
                  <View className={`w-10 h-1 rounded-full mt-1.5 ${mc.bg15}`}>
                    <View
                      className={`h-1 rounded-full ${mc.bg}`}
                      style={{
                        width: `${Math.round(pct * 100)}%`,
                      }}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className={label()}>{config.label}</Text>
                  <View className={row({ gap: "sm", className: "items-baseline" })}>
                    <Text className={numericDisplay({ size: "lg" })} selectable>
                      {display}
                    </Text>
                    <Text className={statLabel()}>{unit}</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    incrementMetric(todayStr, key);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Quick add ${config.label}`}
                  className={`w-10 h-10 rounded-xl items-center justify-center corner-squircle ${mc.bg10}`}
                >
                  <Text className={`text-[20px] font-bold ${mc.text}`}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>
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
