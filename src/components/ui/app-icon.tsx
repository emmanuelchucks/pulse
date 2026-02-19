import type { AndroidSymbol, SFSymbol } from "expo-symbols";
import type { StyleProp, ViewStyle } from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView } from "expo-symbols";

export type AppIconName = {
  ios: SFSymbol;
  android: AndroidSymbol;
  web: AndroidSymbol;
};

type AppIconProps = {
  name: AppIconName;
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function AppIcon({ name, color, size = 20, style }: AppIconProps) {
  return (
    <SymbolView
      name={name}
      tintColor={color}
      style={[{ width: size, height: size }, style]}
      fallback={<MaterialIcons name="help-outline" color={color} size={size} />}
    />
  );
}
