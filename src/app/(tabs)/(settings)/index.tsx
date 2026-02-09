import { ScrollView, View, Text, Pressable, Alert } from "react-native";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MetricKey, METRIC_KEYS, METRIC_CONFIG } from "@/constants/metrics";
import { BG, CARD_BG, TEXT, TEXT_2, TEXT_3 } from "@/constants/colors";
import {
  useWellnessStore,
  Goals,
  updateGoal,
  clearAllData,
} from "@/store/wellness-store";

const CARD = {
  borderRadius: 20,
  borderCurve: "continuous" as const,
  backgroundColor: CARD_BG,
};

function haptic(style = Haptics.ImpactFeedbackStyle.Light) {
  if (process.env.EXPO_OS === "ios") Haptics.impactAsync(style);
}

export default function SettingsScreen() {
  const { entries, goals } = useWellnessStore();

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your wellness entries. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: () => {
            clearAllData();
            if (process.env.EXPO_OS === "ios") {
              Haptics
                .notificationAsync(Haptics.NotificationFeedbackType.Warning)
                .catch(() => {});
            }
          },
        },
      ]
    );
  };

  const totalEntries = Object.keys(entries).length;

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
          Customize your goals
        </Text>
      </Animated.View>

      {/* Daily Goals Header */}
      <View style={{ paddingHorizontal: 4, marginTop: 4 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", color: TEXT }}>
          Daily Goals
        </Text>
        <Text style={{ fontSize: 13, marginTop: 2, color: TEXT_2 }}>
          Adjust targets for each metric
        </Text>
      </View>

      {METRIC_KEYS.map((key, i) => (
        <Animated.View
          key={key}
          entering={FadeInDown.duration(400).delay(50 + i * 50)}
        >
          <GoalCard metric={key} goals={goals} />
        </Animated.View>
      ))}

      {/* Data Header */}
      <View style={{ paddingHorizontal: 4, marginTop: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", color: TEXT }}>
          Data
        </Text>
      </View>

      <Animated.View entering={FadeInDown.duration(400).delay(250)}>
        <View style={{ ...CARD, padding: 16, gap: 14 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 13, color: TEXT_2 }}>Days tracked</Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                fontVariant: ["tabular-nums"],
                color: TEXT,
              }}
              selectable
            >
              {totalEntries}
            </Text>
          </View>
          <Pressable
            onPress={handleClearData}
            accessibilityRole="button"
            accessibilityLabel="Clear All Data"
            style={{
              alignItems: "center",
              paddingVertical: 12,
              borderRadius: 14,
              borderCurve: "continuous",
              backgroundColor: "rgba(255,59,48,0.12)",
            }}
          >
            <Text
              style={{ fontSize: 13, fontWeight: "600", color: "#ff453a" }}
            >
              Clear All Data
            </Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* About Header */}
      <View style={{ paddingHorizontal: 4, marginTop: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", color: TEXT }}>
          About
        </Text>
      </View>

      <Animated.View entering={FadeInDown.duration(400).delay(300)}>
        <View style={{ ...CARD, padding: 16, gap: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: TEXT }}>
            Pulse
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 20, color: TEXT_2 }}>
            Your daily wellness companion. Track water intake, mood, sleep, and
            exercise to build healthier habits.
          </Text>
          <Text style={{ fontSize: 11, marginTop: 6, color: TEXT_3 }}>
            Version 1.0.0
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function GoalCard({ metric, goals }: { metric: MetricKey; goals: Goals }) {
  const config = METRIC_CONFIG[metric];
  const current = goals[metric];

  return (
    <View style={{ ...CARD, padding: 16 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
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
          <Text style={{ fontSize: 13, fontWeight: "500", color: TEXT }}>
            {config.label}
          </Text>
          <Text style={{ fontSize: 11, color: TEXT_3 }}>Daily goal</Text>
        </View>

        <View
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
        >
          <Pressable
            onPress={() => {
              haptic();
              updateGoal(metric, Math.max(config.step, current - config.step));
            }}
            disabled={current <= config.step}
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${config.label} goal`}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              borderCurve: "continuous",
              backgroundColor: config.color + "15",
              alignItems: "center",
              justifyContent: "center",
              opacity: current <= config.step ? 0.3 : 1,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "700", color: config.color }}
            >
              −
            </Text>
          </Pressable>

          <View style={{ alignItems: "center", minWidth: 44 }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                fontVariant: ["tabular-nums"],
                color: TEXT,
              }}
            >
              {current}
            </Text>
            <Text style={{ fontSize: 10, color: TEXT_3 }}>
              {config.unit}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              haptic();
              updateGoal(metric, current + config.step);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Increase ${config.label} goal`}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              borderCurve: "continuous",
              backgroundColor: config.color,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
              +
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
