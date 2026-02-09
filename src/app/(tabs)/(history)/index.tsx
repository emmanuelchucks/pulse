import { ScrollView, View, Text, Pressable } from "react-native";
import { SymbolView } from "expo-symbols";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useReducer } from "react";
import {
  MetricKey,
  METRIC_KEYS,
  METRIC_CONFIG,
  getWeekDates,
  getDayLabel,
  formatDate,
  isToday,
} from "@/constants/metrics";
import { BG, TEXT, TEXT_3 } from "@/constants/colors";
import {
  useWellnessStore,
  DailyEntry,
  Goals,
  getEntry,
  getWeeklyAverage,
  getCompletionRate,
  getStreak,
} from "@/store/wellness-store";
import {
  card,
  caption,
  statLabel,
  statValue,
  sectionHeader,
  sectionTitle,
  scrollContent,
  row,
  BORDER_CURVE,
} from "@/lib/styles";

type WeekAction = { type: "prev" } | { type: "next" };

function weekReducer(state: Date, action: WeekAction): Date {
  const next = new Date(state);
  if (action.type === "prev") next.setDate(next.getDate() - 7);
  else next.setDate(next.getDate() + 7);
  return next;
}

export default function HistoryScreen() {
  const { entries, goals } = useWellnessStore();
  const [referenceDate, dispatch] = useReducer(weekReducer, new Date());

  const completionRate = Math.round(
    getCompletionRate(entries, goals, 7) * 100
  );
  const bestStreak = Math.max(
    ...METRIC_KEYS.map((k) => getStreak(entries, goals, k))
  );
  const weekDates = getWeekDates(referenceDate);
  const canGoNext = weekDates[6] < new Date();
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName={scrollContent()}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text className={caption()}>Track your progress over time</Text>
      </Animated.View>

      {/* Stats row */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(50)}
        className="flex-row gap-3"
      >
        <View className={card({ size: "sm", className: "flex-1 p-3" })} style={BORDER_CURVE}>
          <View className={row({ gap: "sm" })}>
            <SymbolView
              name="checkmark.circle.fill"
              tintColor="#0a84ff"
              style={{ width: 16, height: 16 }}
            />
            <View>
              <Text className={statLabel()}>Completion</Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  fontVariant: ["tabular-nums"],
                  color: TEXT,
                }}
              >
                {completionRate}%
              </Text>
            </View>
          </View>
        </View>
        <View className={card({ size: "sm", className: "flex-1 p-3" })} style={BORDER_CURVE}>
          <View className={row({ gap: "sm" })}>
            <SymbolView
              name="flame.fill"
              tintColor="#ff9f0a"
              style={{ width: 16, height: 16 }}
            />
            <View>
              <Text className={statLabel()}>Best Streak</Text>
              <Text className={statValue({ className: "text-[15px] font-bold" })}>
                {bestStreak} {bestStreak === 1 ? "day" : "days"}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Week nav */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <View className={row({ justify: "between", className: "px-1" })}>
          <Pressable
            onPress={() => dispatch({ type: "prev" })}
            accessibilityLabel="Previous week"
            className="w-9 h-9 rounded-[10px] items-center justify-center"
            style={BORDER_CURVE}
          >
            <SymbolView
              name="chevron.left"
              tintColor="#8e8e93"
              style={{ width: 14, height: 14 }}
            />
          </Pressable>
          <Text className={caption({ className: "font-medium" })}>
            {fmt(weekDates[0])} – {fmt(weekDates[6])}
          </Text>
          <Pressable
            onPress={() => dispatch({ type: "next" })}
            disabled={!canGoNext}
            accessibilityLabel="Next week"
            className="w-9 h-9 rounded-[10px] items-center justify-center"
            style={{ ...BORDER_CURVE, opacity: canGoNext ? 1 : 0.3 }}
          >
            <SymbolView
              name="chevron.right"
              tintColor="#8e8e93"
              style={{ width: 14, height: 14 }}
            />
          </Pressable>
        </View>
      </Animated.View>

      {/* Charts */}
      {METRIC_KEYS.map((key, i) => (
        <Animated.View
          key={key}
          entering={FadeInDown.duration(400).delay(150 + i * 50)}
        >
          <WeekChart
            metric={key}
            weekDates={weekDates}
            entries={entries}
            goals={goals}
          />
        </Animated.View>
      ))}

      {/* Averages */}
      <View className={sectionHeader()}>
        <Text className={sectionTitle()}>Weekly Averages</Text>
      </View>
      <View className="flex-row flex-wrap gap-3">
        {METRIC_KEYS.map((key, i) => {
          const config = METRIC_CONFIG[key];
          const avg = getWeeklyAverage(entries, key, referenceDate);
          return (
            <Animated.View
              key={key}
              entering={FadeInDown.duration(400).delay(350 + i * 50)}
              style={{ width: "47%" } as any}
            >
              <View className={card({ size: "sm", className: "p-3" })} style={BORDER_CURVE}>
                <View className={row({ gap: "sm" })}>
                  <SymbolView
                    name={config.icon}
                    tintColor={config.color}
                    style={{ width: 14, height: 14 }}
                  />
                  <View>
                    <Text className={statLabel()}>{config.label}</Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        fontVariant: ["tabular-nums"],
                        color: TEXT,
                      }}
                    >
                      {avg.toFixed(1)} {config.unit}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function WeekChart({
  metric,
  weekDates,
  entries,
  goals,
}: {
  metric: MetricKey;
  weekDates: Date[];
  entries: Record<string, DailyEntry>;
  goals: Goals;
}) {
  const config = METRIC_CONFIG[metric];
  const goal = goals[metric];
  const values = weekDates.map((d) => getEntry(entries, formatDate(d))[metric]);
  const maxVal = Math.max(...values, goal);

  return (
    <View className={card({ padded: true })} style={BORDER_CURVE}>
      {/* Title */}
      <View className={row({ gap: "sm" })}>
        <SymbolView
          name={config.icon}
          tintColor={config.color}
          style={{ width: 15, height: 15 }}
        />
        <Text className={statValue()}>{config.label}</Text>
      </View>

      {/* Bars */}
      <View
        className={row({ justify: "around", className: "items-end mt-3" })}
        style={{ height: 90 }}
      >
        {weekDates.map((date, idx) => {
          const val = values[idx];
          const h = maxVal > 0 ? (val / maxVal) * 70 : 0;
          const current = isToday(date);
          const met = val >= goal;

          return (
            <View key={idx} className="items-center gap-1 flex-1">
              <Text
                style={{
                  fontSize: 8,
                  fontVariant: ["tabular-nums"],
                  color: TEXT_3,
                }}
              >
                {val > 0
                  ? metric === "sleep"
                    ? val.toFixed(1)
                    : String(val)
                  : ""}
              </Text>
              <View
                style={{
                  width: 22,
                  borderRadius: 6,
                  ...BORDER_CURVE,
                  height: Math.max(h, 3),
                  backgroundColor: met ? config.color : config.color + "40",
                }}
              />
              <Text
                style={{
                  fontSize: 10,
                  color: current ? config.color : "#9ca3af",
                  fontWeight: current ? "700" : "400",
                }}
              >
                {getDayLabel(date)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Footer */}
      <View className={row({ justify: "between", className: "mt-2.5" })}>
        <Text className={statLabel({ className: "text-[10px]" })}>
          Goal: {goal} {config.unit}
        </Text>
        <Text
          style={{ fontSize: 10, fontVariant: ["tabular-nums"], color: TEXT_3 }}
        >
          Avg:{" "}
          {values.filter((v) => v > 0).length > 0
            ? (
                values.reduce((a, b) => a + b, 0) /
                values.filter((v) => v > 0).length
              ).toFixed(1)
            : "–"}{" "}
          {config.unit}
        </Text>
      </View>
    </View>
  );
}
