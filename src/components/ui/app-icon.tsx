import type { AndroidSymbol, SFSymbol } from "expo-symbols";
import type { StyleProp, ViewStyle } from "react-native";
import { SymbolView } from "expo-symbols";

type AppIconName = {
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
    <SymbolView name={name} tintColor={color} style={[{ width: size, height: size }, style]} />
  );
}
