import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import { useEffect, useState } from "react";
import { runMigrations } from "@/db/client";
import { initializeWellnessData } from "@/store/wellness-store";
import "@/global.css";

LogBox.ignoreLogs(["ReactNativeCss:", "RNScreens"]);

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    runMigrations()
      .then(() => {
        initializeWellnessData();
        if (mounted) setIsReady(true);
      })
      .catch((error) => {
        console.error("Failed to initialize database", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!isReady) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
