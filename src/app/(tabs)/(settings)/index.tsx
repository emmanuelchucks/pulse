import * as Haptics from "expo-haptics";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";

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
      contentContainerClassName="px-5 pt-2 pb-10 gap-4"
    >
      <Description>Customize your goals</Description>

      <View className="mt-5 gap-1">
        <Label className="text-xl font-bold">Daily Goals</Label>
        <Description>Adjust targets for each metric</Description>
      </View>

      {METRIC_KEYS.map((key) => (
        <GoalCard key={key} metric={key} goals={goals} />
      ))}

      <View className="mt-5">
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
            className="h-11 rounded-xl border border-red-500/15 bg-red-500/6"
          >
            <Button.Label className="text-red-500/70 dark:text-red-300 font-semibold">
              Clear All Data
            </Button.Label>
          </Button>
        </Card.Body>
      </Card>

      <View className="mt-5">
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
    <View className="size-5 relative">
      <View
        className="absolute rounded-full"
        style={{ backgroundColor: color, width: 14, height: 2, left: 3, top: 9 }}
      />
      {kind === "plus" ? (
        <View
          className="absolute rounded-full"
          style={{ backgroundColor: color, width: 2, height: 14, left: 9, top: 3 }}
        />
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
      <Card.Body className={cardStyles.body({ className: "flex-row items-center justify-between py-4" })}>
        <View className="flex-row items-center gap-3 flex-1 min-w-0 pr-2">
          <View className={`${iconBadge({ size: "sm" })} ${mc.bg10}`}>
            <AppIcon name={config.icon} color={config.color} size={18} />
          </View>

          <View className="flex-1 min-w-0 gap-0.5">
            <Card.Title className="text-lg" numberOfLines={1} ellipsizeMode="tail">
              {config.label}
            </Card.Title>
            <Text className="text-sm text-muted" numberOfLines={1}>
              Daily goal
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2 w-38">
          <Pressable
            onPress={() => {
              updateGoal(metric, Math.max(config.step, current - config.step));
            }}
            disabled={current <= config.step}
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${config.label} goal`}
            className={`${stepperButton({ disabled: current <= config.step })} ${mc.bg10}`}
          >
            <StepperGlyph kind="minus" color={config.color} />
          </Pressable>

          <View className="items-center w-12">
            <Text className={numericText({ size: "md" })}>{current}</Text>
            <Text className="text-xs text-muted" numberOfLines={1}>
              {unitLabel}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              updateGoal(metric, current + config.step);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Increase ${config.label} goal`}
            className={`${stepperButton()} ${mc.bg}`}
          >
            <StepperGlyph kind="plus" color="#ffffff" />
          </Pressable>
        </View>
      </Card.Body>
    </Card>
  );
}
