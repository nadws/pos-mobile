import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* Status Bar Global */}
      <StatusBar style="light" backgroundColor="#1E40AF" />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        {/* 1. Pintu Masuk */}
        <Stack.Screen name="index" />

        {/* 2. Setup / Scan */}
        <Stack.Screen name="scan-setup" />

        {/* 3. Auth */}
        <Stack.Screen name="select-user" />
        <Stack.Screen name="pin-auth" />

        {/* 4. Dashboard (Bottom Tabs) */}
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
