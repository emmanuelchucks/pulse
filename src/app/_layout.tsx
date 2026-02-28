import type { HeroUINativeConfig } from "heroui-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { runMigrations } from "@/db/client";
import "@/theme.css";

const config: HeroUINativeConfig = {
  textProps: { maxFontSizeMultiplier: 1.5 },
  devInfo: { stylingPrinciples: false },
  toast: false,
};

void runMigrations().catch((error) => {
  globalThis.console.error("Failed to run migrations", error);
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider config={config}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
