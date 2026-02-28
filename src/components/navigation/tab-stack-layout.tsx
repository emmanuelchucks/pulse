import { Stack } from "expo-router/stack";
import { useColorScheme } from "react-native";

type TabStackLayoutProps = {
  title: string;
};

export function TabStackLayout({ title }: TabStackLayoutProps) {
  const isDark = useColorScheme() === "dark";

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTintColor: isDark ? "#ffffff" : "#000000",
      }}
    >
      <Stack.Screen name="index" options={{ title }} />
    </Stack>
  );
}
