import * as Haptics from "expo-haptics";
import { Alert, Platform, Text, View, ScrollView } from "react-native";

import { Button, Card, Description, Label } from "heroui-native";

import type { MetricKey } from "@/constants/metrics";
import type { Goals } from "@/db/types";

import { AppIcon } from "@/components/ui/app-icon";
import { METRIC_CONFIG, METRIC_KEYS } from "@/constants/metrics";
import { iconBadge, METRIC_TW, numericText, panel, stepperButton } from "@/lib/metric-theme";
import { clearAllData, updateGoal, useWellnessStore } from "@/store/wellness-store";


export default function SettingsScreen() {
  const { entries, goals } = useWellnessStore();
  const cardStyles = panel();

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
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-5 pt-1 pb-20 gap-4"
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

      <Card className={cardStyles.base()}>
        <Card.Body className={cardStyles.body({ className: "gap-3.5" })}>
          <View className="flex-row items-center justify-between">
            <Description>Days tracked</Description>
            <Text className={numericText({ size: "xs", className: "font-semibold" })}>
              {totalEntries}
            </Text>
          </View>

          <Button
            variant="ghost"
            onPress={handleClearData}
            accessibilityLabel="Clear All Data"
            className="h-11 rounded-xl border border-red-500/60 bg-red-500/20"
          >
            <Button.Label className="text-red-200 font-semibold">Clear All Data</Button.Label>
          </Button>
        </Card.Body>
      </Card>

      <View className="px-1 mt-1">
        <Label className="text-xl font-bold">About</Label>
      </View>

      <Card className={cardStyles.base()}>
        <Card.Body className={cardStyles.body({ className: "gap-1.5" })}>
          <Card.Title className="text-lg">Pulse</Card.Title>
          <Card.Description className="leading-6">
            Your daily wellness companion. Track water intake, mood, sleep, and exercise to build
            healthier habits.
          </Card.Description>
          <Description className="pt-1 text-sm">Version 1.0.0</Description>
        </Card.Body>
      </Card>
    </ScrollView>
  );
}

function StepperGlyph({ kind, color }: { kind: "plus" | "minus"; color: string }) {
  return (
    <View className="size-5 items-center justify-center">
      <View className="absolute w-3.5 h-0.5 rounded-full" style={{ backgroundColor: color }} />
      {kind === "plus" ? (
        <View className="absolute h-3.5 w-0.5 rounded-full" style={{ backgroundColor: color }} />
      ) : null}
    </View>
  );
}

function GoalCard({ metric, goals }: { metric: MetricKey; goals: Goals }) {
  const config = METRIC_CONFIG[metric];
  const current = goals[metric];
  const mc = METRIC_TW[metric];
  const unitLabel = config.unit || "level";
  const cardStyles = panel();

  return (
    <Card className={cardStyles.base()}>
      <Card.Body className={cardStyles.body({ className: "flex-row items-start gap-3" })}>
        <View className={`${iconBadge()} ${mc.bg10} mt-0.5`}>
          <AppIcon name={config.icon} color={config.color} size={18} />
        </View>

        <View className="flex-1 gap-0.5">
          <Card.Title className="text-lg">{config.label}</Card.Title>
          <Description className="text-sm">Daily goal</Description>
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
            className={`${stepperButton({ disabled: current <= config.step })} size-10 ${mc.bg10}`}
          >
            <View className="size-full items-center justify-center">
              <StepperGlyph kind="minus" color={config.color} />
            </View>
          </Button>

          <View className="items-center min-w-12">
            <Text className={numericText({ size: "md" })}>{current}</Text>
            <Description className="text-sm">{unitLabel}</Description>
          </View>

          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            onPress={() => {
              updateGoal(metric, current + config.step);
            }}
            accessibilityLabel={`Increase ${config.label} goal`}
            className={`${stepperButton()} size-10 ${mc.bg}`}
          >
            <View className="size-full items-center justify-center">
              <StepperGlyph kind="plus" color="#ffffff" />
            </View>
          </Button>
        </View>
      </Card.Body>
    </Card>
  );
}
