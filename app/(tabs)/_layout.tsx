import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarHideOnKeyboard: true,

        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          elevation: 8,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      {/* TAB BERANDA */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="view-dashboard-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* TAB POS (FLOATING BUTTON) */}
      <Tabs.Screen
        name="pos"
        options={{
          title: "Kasir",
          tabBarLabel: "",
          tabBarIcon: () => (
            <View
              style={[styles.posButton, { marginBottom: 20 + insets.bottom }]}
            >
              <MaterialCommunityIcons
                name="monitor-dashboard"
                size={28}
                color="white"
              />
            </View>
          ),
        }}
      />

      {/* TAB AKUN */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Akun",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  posButton: {
    width: 56,
    height: 56,
    backgroundColor: "#2563EB",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
});
