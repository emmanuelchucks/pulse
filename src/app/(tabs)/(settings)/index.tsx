import { ScrollView, View, Text, Pressable } from "react-native";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MetricKey, METRIC_KEYS, METRIC_CONFIG } from "@/constants/metrics";
import {
  useWellnessStore,
  Goals,
  updateGoal,
  clearAllData,
} from "@/store/wellness-store";
import {
  card,
  scrollContainer,
  sectionHeader,
  text,
  iconBox,
  controlButton,
  row,
} from "@/lib/styles";

const sc = scrollContainer();
const sh = sectionHeader();

function haptic(style = Haptics.ImpactFeedbackStyle.Light) {
  if (process.env.EXPO_OS === "ios") Haptics.impactAsync(style);
}

export default function SettingsScreen() {
  const { entries, goals } = useWellnessStore();

  const handleClearData = () => {
    clearAllData();
    if (process.env.EXPO_OS === "ios") {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      ).catch(() => {});
    }
  };

  const totalEntries = Object.keys(entries).length;

  return (
    <ScrollView
      className={sc.root()}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName={sc.content()}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text className={text({ variant: "body" })}>
          Customize your goals
        </Text>
      </Animated.View>

      {/* Daily Goals Header */}
      <View className={sh.wrapper()}>
        <Text className={sh.title()} style={{ fontSize: 20 }}>
          Daily Goals
        </Text>
        <Text className={sh.subtitle()}>Adjust targets for each metric</Text>
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
      <View className={sh.wrapper()} style={{ marginTop: 8 }}>
        <Text className={sh.title()} style={{ fontSize: 20 }}>
          Data
        </Text>
      </View>

      <Animated.View entering={FadeInDown.duration(400).delay(250)}>
        <View className={card()} style={{ gap: 14, padding: 16 }}>
          <View className={row({ justify: "between" })}>
            <Text className={text({ variant: "body" })}>Days tracked</Text>
            <Text className={text({ variant: "value" })} selectable>
              {totalEntries}
            </Text>
          </View>
          <Pressable
            onPress={handleClearData}
            accessibilityRole="button"
            accessibilityLabel="Clear All Data"
            className={controlButton({
              variant: "danger",
              className: "w-full py-3 rounded-[14px]",
            })}
          >
            <Text className="text-[13px] font-semibold text-sf-red">
              Clear All Data
            </Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* About Header */}
      <View className={sh.wrapper()} style={{ marginTop: 8 }}>
        <Text className={sh.title()} style={{ fontSize: 20 }}>
          About
        </Text>
      </View>

      <Animated.View entering={FadeInDown.duration(400).delay(300)}>
        <View className={card()} style={{ padding: 16, gap: 6 }}>
          <Text className={text({ variant: "title" })}>Pulse</Text>
          <Text className="text-[13px] leading-5 text-sf-text-2">
            Your daily wellness companion. Track water intake, mood, sleep, and
            exercise to build healthier habits.
          </Text>
          <Text className={text({ variant: "caption" })} style={{ marginTop: 6 }}>
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
    <View className={card()} style={{ padding: 16 }}>
      <View className={row({ gap: "md" })}>
        <View
          className={iconBox()}
          style={{ backgroundColor: config.color + "20" }}
        >
          <SymbolView
            name={config.icon}
            tintColor={config.color}
            style={{ width: 18, height: 18 }}
          />
        </View>

        <View className="flex-1">
          <Text className="text-[13px] font-medium text-sf-text">
            {config.label}
          </Text>
          <Text className={text({ variant: "caption" })}>Daily goal</Text>
        </View>

        <View className={row({ gap: "sm" })} style={{ gap: 10 }}>
          <Pressable
            onPress={() => {
              haptic();
              updateGoal(metric, Math.max(config.step, current - config.step));
            }}
            disabled={current <= config.step}
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${config.label} goal`}
            className={controlButton({ size: "sm" })}
            style={{
              backgroundColor: config.color + "15",
              opacity: current <= config.step ? 0.3 : 1,
            }}
          >
            <Text
              className="text-lg font-bold"
              style={{ color: config.color }}
            >
              −
            </Text>
          </Pressable>

          <View className="items-center min-w-[44px]">
            <Text className={text({ variant: "value" })} style={{ fontSize: 17 }}>
              {current}
            </Text>
            <Text className={text({ variant: "tiny" })}>{config.unit}</Text>
          </View>

          <Pressable
            onPress={() => {
              haptic();
              updateGoal(metric, current + config.step);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Increase ${config.label} goal`}
            className={controlButton({ size: "sm" })}
            style={{ backgroundColor: config.color }}
          >
            <Text className="text-base font-bold text-white">+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
