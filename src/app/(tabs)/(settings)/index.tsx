import { ScrollView, View, Text, Pressable, Alert } from "react-native";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MetricKey, METRIC_KEYS, METRIC_CONFIG } from "@/constants/metrics";
import { BG, TEXT } from "@/constants/colors";
import {
  useWellnessStore,
  Goals,
  updateGoal,
  clearAllData,
} from "@/store/wellness-store";
import {
  card,
  caption,
  heading,
  statLabel,
  sectionHeader,
  sectionTitle,
  sectionSubtitle,
  scrollContent,
  row,
  iconBadge,
  stepperButton,
  BORDER_CURVE,
} from "@/lib/styles";

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
      contentContainerClassName={scrollContent()}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text className={caption()}>Customize your goals</Text>
      </Animated.View>

      {/* Daily Goals Header */}
      <View className={sectionHeader()}>
        <Text className={sectionTitle()}>Daily Goals</Text>
        <Text className={sectionSubtitle()}>
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
      <View className={sectionHeader({ className: "mt-2" })}>
        <Text className={sectionTitle()}>Data</Text>
      </View>

      <Animated.View entering={FadeInDown.duration(400).delay(250)}>
        <View className={card({ padded: true, className: "gap-3.5" })} style={BORDER_CURVE}>
          <View className={row({ justify: "between" })}>
            <Text className={caption()}>Days tracked</Text>
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
            className="items-center py-3 rounded-[14px]"
            style={{
              ...BORDER_CURVE,
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
      <View className={sectionHeader({ className: "mt-2" })}>
        <Text className={sectionTitle()}>About</Text>
      </View>

      <Animated.View entering={FadeInDown.duration(400).delay(300)}>
        <View className={card({ padded: true, className: "gap-1.5" })} style={BORDER_CURVE}>
          <Text className={heading({ className: "text-[15px]" })}>Pulse</Text>
          <Text className={caption({ className: "leading-5" })}>
            Your daily wellness companion. Track water intake, mood, sleep, and
            exercise to build healthier habits.
          </Text>
          <Text className={statLabel({ className: "mt-1.5" })}>
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
    <View className={card({ padded: true })} style={BORDER_CURVE}>
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
          <Text className={caption({ className: "font-medium text-sf-text" })}>
            {config.label}
          </Text>
          <Text className={statLabel()}>Daily goal</Text>
        </View>

        <View className={row({ className: "gap-2.5" })}>
          <Pressable
            onPress={() => {
              haptic();
              updateGoal(metric, Math.max(config.step, current - config.step));
            }}
            disabled={current <= config.step}
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${config.label} goal`}
            className={stepperButton({ size: "sm" })}
            style={{
              ...BORDER_CURVE,
              backgroundColor: config.color + "15",
              opacity: current <= config.step ? 0.3 : 1,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "700", color: config.color }}
            >
              −
            </Text>
          </Pressable>

          <View className="items-center min-w-[44px]">
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
            <Text className={statLabel({ className: "text-[10px]" })}>
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
            className={stepperButton({ size: "sm" })}
            style={{
              ...BORDER_CURVE,
              backgroundColor: config.color,
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
