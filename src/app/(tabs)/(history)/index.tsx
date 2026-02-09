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
import { BG, CARD_BG, TEXT, TEXT_2, TEXT_3 } from "@/constants/colors";
import {
  useWellnessStore,
  DailyEntry,
  Goals,
  getEntry,
  getWeeklyAverage,
  getCompletionRate,
  getStreak,
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
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 12,
      }}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={{ fontSize: 13, color: TEXT_2 }}>
          Track your progress over time
        </Text>
      </Animated.View>

      {/* Stats row */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(50)}
        style={{ flexDirection: "row", gap: 12 }}
      >
        <View style={{ ...CARD_SM, flex: 1, padding: 12 }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <SymbolView
              name="checkmark.circle.fill"
              tintColor="#0a84ff"
              style={{ width: 16, height: 16 }}
            />
            <View>
              <Text style={{ fontSize: 11, color: TEXT_3 }}>Completion</Text>
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
        <View style={{ ...CARD_SM, flex: 1, padding: 12 }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <SymbolView
              name="flame.fill"
              tintColor="#ff9f0a"
              style={{ width: 16, height: 16 }}
            />
            <View>
              <Text style={{ fontSize: 11, color: TEXT_3 }}>Best Streak</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: TEXT }}>
                {bestStreak} {bestStreak === 1 ? "day" : "days"}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Week nav */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 4,
          }}
        >
          <Pressable
            onPress={() => dispatch({ type: "prev" })}
            accessibilityLabel="Previous week"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              borderCurve: "continuous",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SymbolView
              name="chevron.left"
              tintColor="#8e8e93"
              style={{ width: 14, height: 14 }}
            />
          </Pressable>
          <Text
            style={{ fontSize: 13, fontWeight: "500", color: TEXT_2 }}
          >
            {fmt(weekDates[0])} – {fmt(weekDates[6])}
          </Text>
          <Pressable
            onPress={() => dispatch({ type: "next" })}
            disabled={!canGoNext}
            accessibilityLabel="Next week"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              borderCurve: "continuous",
              alignItems: "center",
              justifyContent: "center",
              opacity: canGoNext ? 1 : 0.3,
            }}
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
      <View style={{ paddingHorizontal: 4, marginTop: 4 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", color: TEXT }}>
          Weekly Averages
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {METRIC_KEYS.map((key, i) => {
          const config = METRIC_CONFIG[key];
          const avg = getWeeklyAverage(entries, key, referenceDate);
          return (
            <Animated.View
              key={key}
              entering={FadeInDown.duration(400).delay(350 + i * 50)}
              style={{ width: "47%" } as any}
            >
              <View style={{ ...CARD_SM, padding: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <SymbolView
                    name={config.icon}
                    tintColor={config.color}
                    style={{ width: 14, height: 14 }}
                  />
                  <View>
                    <Text style={{ fontSize: 11, color: TEXT_3 }}>
                      {config.label}
                    </Text>
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
    <View style={{ ...CARD, padding: 16 }}>
      {/* Title */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <SymbolView
          name={config.icon}
          tintColor={config.color}
          style={{ width: 15, height: 15 }}
        />
        <Text style={{ fontSize: 13, fontWeight: "600", color: TEXT }}>
          {config.label}
        </Text>
      </View>

      {/* Bars */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-around",
          height: 90,
          marginTop: 12,
        }}
      >
        {weekDates.map((date, idx) => {
          const val = values[idx];
          const h = maxVal > 0 ? (val / maxVal) * 70 : 0;
          const current = isToday(date);
          const met = val >= goal;

          return (
            <View
              key={idx}
              style={{ alignItems: "center", gap: 4, flex: 1 }}
            >
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
                  borderCurve: "continuous",
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
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <Text style={{ fontSize: 10, color: TEXT_3 }}>
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
