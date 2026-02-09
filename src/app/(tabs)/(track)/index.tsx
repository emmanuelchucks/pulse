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
import { BG, TEXT, TEXT_3 } from "@/constants/colors";
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
  caption,
  heading,
  statLabel,
  row,
  iconBadge,
  stepperButton,
  scrollContent,
  BORDER_CURVE,
} from "@/lib/styles";

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
        contentContainerClassName={scrollContent()}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text className={caption()}>Log your daily wellness</Text>
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
    <View className={card({ size: "md" })} style={BORDER_CURVE}>
      {/* Header */}
      <View className={row({ gap: "md" })}>
        <View
          className={iconBadge({ size: "sm" })}
          style={{ ...BORDER_CURVE, backgroundColor: config.color + "20" }}
        >
          <SymbolView
            name={config.icon}
            tintColor={config.color}
            style={{ width: 18, height: 18 }}
          />
        </View>
        <View className="flex-1">
          <Text className={heading({ className: "text-[15px]" })}>
            {config.label}
          </Text>
          <Text className={statLabel()}>
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
      <View className={row({ justify: "center", className: "gap-6 mt-[18px]" })}>
        <Pressable
          onPress={() => {
            haptic(Haptics.ImpactFeedbackStyle.Light);
            decrementMetric(todayStr, metric);
          }}
          disabled={value <= config.min}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${config.label}`}
          className={stepperButton({ size: "md" })}
          style={{
            ...BORDER_CURVE,
            backgroundColor: config.color + "15",
            opacity: value <= config.min ? 0.3 : 1,
          }}
        >
          <Text
            style={{ fontSize: 22, fontWeight: "700", color: config.color }}
          >
            −
          </Text>
        </Pressable>

        <View className="items-center min-w-[72px]">
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
          className={stepperButton({ size: "md" })}
          style={{
            ...BORDER_CURVE,
            backgroundColor: config.color,
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
    <View className={card({ size: "md" })} style={BORDER_CURVE}>
      <View className={row({ gap: "md" })}>
        <View
          className={iconBadge({ size: "sm" })}
          style={{ ...BORDER_CURVE, backgroundColor: config.color + "20" }}
        >
          <SymbolView
            name={config.icon}
            tintColor={config.color}
            style={{ width: 18, height: 18 }}
          />
        </View>
        <View>
          <Text className={heading({ className: "text-[15px]" })}>
            How are you feeling?
          </Text>
          <Text className={statLabel()}>
            {value > 0
              ? `${MOOD_LABELS[value]} ${MOOD_EMOJIS[value]}`
              : "Tap to log your mood"}
          </Text>
        </View>
      </View>

      <View className={row({ justify: "around", className: "mt-4" })}>
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
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                ...BORDER_CURVE,
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
            <Text className={statLabel({ className: "text-[10px]" })}>
              {MOOD_LABELS[mood]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
