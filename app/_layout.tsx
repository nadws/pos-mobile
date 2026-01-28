import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#1E40AF" />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="home" />

        <Stack.Screen name="scan-setup" />

        <Stack.Screen name="select-user" />
        <Stack.Screen name="pin-auth" />

        {/* <Stack.Screen name="(tabs)" options={{ animation: "fade" }} /> */}
      </Stack>
    </SafeAreaProvider>
  );
}
