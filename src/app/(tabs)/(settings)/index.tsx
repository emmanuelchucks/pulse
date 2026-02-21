import * as Haptics from "expo-haptics";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";

import type { MetricKey } from "@/constants/metrics";
import type { Goals } from "@/db/types";

import { AppIcon } from "@/components/ui/app-icon";
import { METRIC_KEYS, METRIC_CONFIG } from "@/constants/metrics";
import {
  card,
  caption,
  heading,
  statLabel,
  numericDisplay,
  sectionHeader,
  sectionTitle,
  sectionSubtitle,
  scrollContent,
  row,
  iconBadge,
  stepperButton,
  METRIC_CLASSES,
} from "@/lib/styles";
import { useWellnessStore, updateGoal, clearAllData } from "@/store/wellness-store";

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
            if (Platform.OS === "ios") {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
                () => {},
              );
            }
          },
        },
      ],
    );
  };

  const totalEntries = Object.keys(entries).length;

  return (
    <ScrollView
      className="flex-1 bg-sf-bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerClassName={scrollContent()}
    >
      <View className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Text className={caption()}>Customize your goals</Text>
      </View>

      <View className={sectionHeader()}>
        <Text className={sectionTitle()}>Daily Goals</Text>
        <Text className={sectionSubtitle()}>Adjust targets for each metric</Text>
      </View>

      {METRIC_KEYS.map((key) => (
        <View key={key} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <GoalCard metric={key} goals={goals} />
        </View>
      ))}

      <View className={sectionHeader({ className: "mt-2" })}>
        <Text className={sectionTitle()}>Data</Text>
      </View>

      <View className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <View className={card({ padded: true, className: "gap-3.5" })}>
          <View className={row({ justify: "between" })}>
            <Text className={caption()}>Days tracked</Text>
            <Text className={numericDisplay({ size: "xs", className: "font-semibold" })} selectable>
              {totalEntries}
            </Text>
          </View>
          <Pressable
            onPress={handleClearData}
            accessibilityRole="button"
            accessibilityLabel="Clear All Data"
            className="items-center py-3 rounded-[14px] corner-squircle bg-red-500/12"
          >
            <Text className="text-[13px] font-semibold text-sf-red">Clear All Data</Text>
          </Pressable>
        </View>
      </View>

      <View className={sectionHeader({ className: "mt-2" })}>
        <Text className={sectionTitle()}>About</Text>
      </View>

      <View className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <View className={card({ padded: true, className: "gap-1.5" })}>
          <Text className={heading({ className: "text-[15px]" })}>Pulse</Text>
          <Text className={caption({ className: "leading-5" })}>
            Your daily wellness companion. Track water intake, mood, sleep, and exercise to build
            healthier habits.
          </Text>
          <Text className={statLabel({ className: "mt-1.5" })}>Version 1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function GoalCard({ metric, goals }: { metric: MetricKey; goals: Goals }) {
  const config = METRIC_CONFIG[metric];
  const current = goals[metric];
  const colors = METRIC_CLASSES[metric];

  return (
    <View className={card({ padded: true })}>
      <View className={row({ gap: "md" })}>
        <View className={iconBadge({ size: "sm", className: colors.bg10 })}>
          <AppIcon name={config.icon} color={config.color} size={18} />
        </View>

        <View className="flex-1">
          <Text className={caption({ className: "font-medium text-sf-text" })}>{config.label}</Text>
          <Text className={statLabel()}>Daily goal</Text>
        </View>

        <View className={row({ className: "gap-2.5" })}>
          <Pressable
            onPress={() => {
              updateGoal(metric, Math.max(config.step, current - config.step));
            }}
            disabled={current <= config.step}
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${config.label} goal`}
            className={stepperButton({
              size: "sm",
              className: `${colors.bg10} ${current <= config.step ? "opacity-30" : "opacity-100"}`,
            })}
          >
            <Text className={`text-[18px] font-bold ${colors.text}`}>−</Text>
          </Pressable>

          <View className="items-center min-w-[44px]">
            <Text className={numericDisplay({ size: "md" })}>{current}</Text>
            <Text className={statLabel({ className: "text-[10px]" })}>{config.unit}</Text>
          </View>

          <Pressable
            onPress={() => {
              updateGoal(metric, current + config.step);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Increase ${config.label} goal`}
            className={stepperButton({ size: "sm", className: colors.bg })}
          >
            <Text className="text-[16px] font-bold text-white">+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
