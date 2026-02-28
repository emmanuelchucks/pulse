import { Card, Description } from "heroui-native";
import { Text, View } from "react-native";
import type { MetricKey } from "@/constants/metrics";
import type { DailyEntry, Goals } from "@/db/types";
import { AppIcon } from "@/components/ui/app-icon";
import { formatDate, getDayLabel, isToday, METRIC_CONFIG } from "@/constants/metrics";
import { getEntry } from "@/features/wellness/domain/analytics";
import { METRIC_TW, panel } from "@/lib/metric-theme";

type WeekChartProps = {
  metric: MetricKey;
  weekDates: Date[];
  entries: Record<string, DailyEntry>;
  goals: Goals;
};

export function WeekChart({ metric, weekDates, entries, goals }: WeekChartProps) {
  const config = METRIC_CONFIG[metric];
  const goal = goals[metric];
  const values = weekDates.map((d) => getEntry(entries, formatDate(d))[metric]);
  const maxVal = Math.max(...values, goal);
  const mc = METRIC_TW[metric];
  const smCard = panel({ density: "sm" });

  const average =
    values.filter((v) => v > 0).length > 0
      ? (values.reduce((a, b) => a + b, 0) / values.filter((v) => v > 0).length).toFixed(1)
      : "–";

  return (
    <Card className={smCard.base()}>
      <Card.Body className={smCard.body({ className: "gap-3" })}>
        <View className="flex-row items-center gap-2">
          <AppIcon name={config.icon} color={config.color} size={15} />
          <Card.Title className="text-base">{config.label}</Card.Title>
        </View>

        <View className="h-24 flex-row items-end justify-between px-1">
          {weekDates.map((date, idx) => {
            const val = values[idx] ?? 0;
            const h = maxVal > 0 ? (val / maxVal) * 68 : 0;
            const current = isToday(date);
            const met = val >= goal;

            return (
              <View key={formatDate(date)} className="flex-1 items-center gap-1">
                <Text className="text-muted text-xs tabular-nums">
                  {val > 0 ? (metric === "sleep" ? val.toFixed(1) : String(val)) : ""}
                </Text>

                <View
                  className={`w-5 rounded-md ${met ? mc.bg : mc.bg40}`}
                  style={{ height: Math.max(h, 6), borderCurve: "continuous" }}
                />

                <Text className={`text-sm ${current ? `font-semibold ${mc.text}` : "text-muted"}`}>
                  {getDayLabel(date)}
                </Text>
              </View>
            );
          })}
        </View>

        <View className="flex-row items-center justify-between">
          <Description className="text-sm">
            Goal: {goal} {config.unit}
          </Description>
          <Text className="text-muted text-sm tabular-nums">
            Avg: {average} {config.unit}
          </Text>
        </View>
      </Card.Body>
    </Card>
  );
}
