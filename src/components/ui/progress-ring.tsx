import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { numericText } from "@/lib/metric-theme";

type ProgressRingProps = {
  value: number;
  color: string;
  trackColor: string;
  size?: number;
  stroke?: number;
};

export function ProgressRing({ value, color, trackColor, size = 80, stroke = 4 }: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(value, 100));
  const offset = circumference * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="absolute items-center justify-center">
        <Text className={numericText({ size: "md" })}>{Math.round(clamped)}%</Text>
      </View>
    </View>
  );
}
