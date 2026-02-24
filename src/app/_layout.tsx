import type { HeroUINativeConfig } from "heroui-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect, useState } from "react";
import { LogBox, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { runMigrations } from "@/db/client";
import { initializeWellnessData } from "@/store/wellness-store";
import "@/theme.css";

LogBox.ignoreLogs(["ReactNativeCss:", "RNScreens", "RCTEventEmitter.receiveEvent"]);

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if already hidden.
});

const config: HeroUINativeConfig = {
  textProps: { maxFontSizeMultiplier: 1.5 },
  devInfo: { stylingPrinciples: false },
  toast: false,
};

type BootStatus = "loading" | "ready" | "error";

function BootErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="bg-background flex-1 items-center justify-center px-6">
      <Text className="text-foreground text-center text-lg font-semibold">
        Failed to initialize database
      </Text>
      <Text className="text-muted-foreground mt-2 text-center">
        Please retry. Your existing local data was not modified.
      </Text>
      <Pressable className="bg-danger mt-5 rounded-xl px-4 py-2" onPress={onRetry}>
        <Text className="text-danger-foreground font-medium">Retry</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const [status, setStatus] = useState<BootStatus>("loading");

  const initialize = async () => {
    setStatus("loading");

    try {
      await runMigrations();
      initializeWellnessData();
      setStatus("ready");
      await SplashScreen.hideAsync();
    } catch (error) {
      globalThis.console.error("Failed to initialize database", error);
      setStatus("error");
      await SplashScreen.hideAsync();
    }
  };

  useEffect(() => {
    void initialize();
  }, []);

  if (status === "loading") {
    return null;
  }

  if (status === "error") {
    return <BootErrorScreen onRetry={() => void initialize()} />;
  }

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
