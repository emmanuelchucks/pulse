import { Stack } from "expo-router/stack";
import { useColorScheme } from "react-native";

export default function HistoryLayout() {
  const isDark = useColorScheme() === "dark";

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTintColor: isDark ? "#ffffff" : "#000000",
      }}
    >
      <Stack.Screen name="index" options={{ title: "History" }} />
    </Stack>
  );
}
