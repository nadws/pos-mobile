import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Kita buat header sendiri nanti di tiap halaman
        tabBarActiveTintColor: '#2563EB', // Warna Biru saat aktif
        tabBarInactiveTintColor: '#9CA3AF', // Warna Abu saat tidak aktif
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {/* 1. TAB DASHBOARD */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 2. TAB KASIR (POS) */}
      <Tabs.Screen
        name="pos"
        options={{
          title: 'Kasir',
          tabBarIcon: ({ color, size }) => (
            // Kita buat ikon Kasir lebih menonjol (Floating Button effect)
            <View style={styles.posButton}>
               <MaterialCommunityIcons name="monitor-dashboard" size={28} color="white" />
            </View>
          ),
          tabBarLabel: '', // Kosongkan label biar ikonnya di tengah sendirian
        }}
      />

      {/* 3. TAB SETTING */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Akun',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  posButton: {
    width: 50,
    height: 50,
    backgroundColor: '#2563EB',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20, // Biar agak naik ke atas (Floating)
    elevation: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  }
});