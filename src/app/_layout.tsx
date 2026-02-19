import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { LogBox, Pressable, Text, View } from "react-native";

import { runMigrations } from "@/db/client";
import { initializeWellnessData } from "@/store/wellness-store";
import "@/global.css";

LogBox.ignoreLogs(["ReactNativeCss:", "RNScreens", "RCTEventEmitter.receiveEvent"]);

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if already hidden.
});

type BootStatus = "loading" | "ready" | "error";

function BootScreen({ onRetry }: { onRetry?: () => void }) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-foreground text-lg font-semibold">Preparing Pulse…</Text>
      {onRetry ? (
        <Pressable className="mt-5 rounded-xl bg-primary px-4 py-2" onPress={onRetry}>
          <Text className="text-primary-foreground font-medium">Retry initialization</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function BootErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-foreground text-center text-lg font-semibold">
        Failed to initialize database
      </Text>
      <Text className="text-muted-foreground mt-2 text-center">
        Please retry. Your existing local data was not modified.
      </Text>
      <Pressable className="mt-5 rounded-xl bg-primary px-4 py-2" onPress={onRetry}>
        <Text className="text-primary-foreground font-medium">Retry</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const [status, setStatus] = useState<BootStatus>("loading");

  const initialize = useCallback(async () => {
    setStatus("loading");

    try {
      await runMigrations();
      initializeWellnessData();
      setStatus("ready");
      await SplashScreen.hideAsync();
    } catch (error) {
      console.error("Failed to initialize database", error);
      setStatus("error");
      await SplashScreen.hideAsync();
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (status === "loading") {
    return <BootScreen />;
  }

  if (status === "error") {
    return <BootErrorScreen onRetry={initialize} />;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
