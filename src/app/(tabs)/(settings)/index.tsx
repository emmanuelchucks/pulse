import * as Haptics from "expo-haptics";
import { Alert, Platform, ScrollView, Text, View } from "react-native";

import { Button, Card, Description, Label } from "heroui-native";

import type { MetricKey } from "@/constants/metrics";
import type { Goals } from "@/db/types";

import { AppIcon } from "@/components/ui/app-icon";
import { METRIC_KEYS, METRIC_CONFIG } from "@/constants/metrics";
import { numericText, METRIC_TW } from "@/lib/metric-theme";
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
  const surface = "rounded-[22px] border border-foreground/10 bg-foreground/[0.03]";

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-5 pt-1 pb-28 gap-4"
    >
      <Description>Customize your goals</Description>

      <View className="px-1 gap-0.5">
        <Label className="text-xl font-bold">Daily Goals</Label>
        <Description>Adjust targets for each metric</Description>
      </View>

      {METRIC_KEYS.map((key) => (
        <GoalCard key={key} metric={key} goals={goals} />
      ))}

      <View className="px-1 mt-1">
        <Label className="text-xl font-bold">Data</Label>
      </View>

      <Card className={surface}>
        <Card.Body className="p-4 gap-3.5">
          <View className="flex-row items-center justify-between">
            <Description>Days tracked</Description>
            <Text className={numericText({ size: "xs", className: "font-semibold" })}>
              {totalEntries}
            </Text>
          </View>

          <Button
            variant="danger-soft"
            onPress={handleClearData}
            accessibilityLabel="Clear All Data"
            className="w-full rounded-xl"
          >
            <Button.Label>Clear All Data</Button.Label>
          </Button>
        </Card.Body>
      </Card>

      <View className="px-1 mt-1">
        <Label className="text-xl font-bold">About</Label>
      </View>

      <Card className={surface}>
        <Card.Body className="p-4 gap-1.5">
          <Card.Title className="text-[15px]">Pulse</Card.Title>
          <Card.Description className="leading-5">
            Your daily wellness companion. Track water intake, mood, sleep, and exercise to build
            healthier habits.
          </Card.Description>
          <Description className="mt-1.5 text-[11px]">Version 1.0.0</Description>
        </Card.Body>
      </Card>
    </ScrollView>
  );
}

function GoalCard({ metric, goals }: { metric: MetricKey; goals: Goals }) {
  const config = METRIC_CONFIG[metric];
  const current = goals[metric];
  const mc = METRIC_TW[metric];
  const surface = "rounded-[22px] border border-foreground/10 bg-foreground/[0.03]";

  return (
    <Card className={surface}>
      <Card.Body className="p-4 flex-row items-center gap-3">
        <View
          className={`w-[40px] h-[40px] rounded-[12px] items-center justify-center ${mc.bg10}`}
          style={{ borderCurve: "continuous" }}
        >
          <AppIcon name={config.icon} color={config.color} size={18} />
        </View>

        <View className="flex-1 gap-0.5">
          <Card.Title className="text-[15px]">{config.label}</Card.Title>
          <Description className="text-[11px]">Daily goal</Description>
        </View>

        <View className="flex-row items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            onPress={() => {
              updateGoal(metric, Math.max(config.step, current - config.step));
            }}
            isDisabled={current <= config.step}
            accessibilityLabel={`Decrease ${config.label} goal`}
            className={`w-9 h-9 rounded-[11px] ${mc.bg10}`}
          >
            <Button.Label className={`text-[18px] font-bold ${mc.text}`}>−</Button.Label>
          </Button>

          <View className="items-center min-w-[48px]">
            <Text className={numericText({ size: "md" })}>{current}</Text>
            <Description className="text-[10px]">{config.unit}</Description>
          </View>

          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            onPress={() => {
              updateGoal(metric, current + config.step);
            }}
            accessibilityLabel={`Increase ${config.label} goal`}
            className={`w-9 h-9 rounded-[11px] ${mc.bg}`}
          >
            <Button.Label className="text-[17px] font-bold text-white">+</Button.Label>
          </Button>
        </View>
      </Card.Body>
    </Card>
  );
}
