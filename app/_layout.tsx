import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export default function RootLayout() {
  return (
    <>
      {/* Status Bar Global: Teks putih, Background Biru */}
      <StatusBar style="light" backgroundColor="#1E40AF" />

      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        
        {/* 1. index: Pintu Masuk Utama (Satpam) */}
        <Stack.Screen name="index" />

        {/* 2. Halaman Scan QR (Yang baru mau dibuat) */}
        <Stack.Screen name="scan-setup" />

        {/* 3. Halaman Auth Lainnya */}
        <Stack.Screen name="select-user" />
        <Stack.Screen name="pin-auth" />

        {/* 4. Dashboard */}
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />

      </Stack>
    </>
  );
}