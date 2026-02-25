import { View } from "react-native";

export function StepperGlyph({ kind, color }: { kind: "plus" | "minus"; color: string }) {
  return (
    <View className="relative size-5">
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
