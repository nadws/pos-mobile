import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export default function RootLayout() {
  return (
    <>
      {/* Status Bar Global: 
        Kita set style="light" (text putih) dan background biru #2563EB
        agar menyatu dengan header aplikasi Kasir kita.
      */}
      <StatusBar style="light" backgroundColor="#2563EB" />

      {/* Stack Navigator: 
        Daftar halaman yang didaftarkan dalam aplikasi.
        Logic "redirect" sudah dihapus dari sini agar tidak bentrok dengan index.tsx.
      */}
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        
        {/* 1. PINTU GERBANG (Logic Cek Login & Form Sambung Toko) */}
        <Stack.Screen name="index" />

        {/* 2. Halaman Pilih Kasir (Asep, Budi, dll) */}
        <Stack.Screen name="select-user" />

        {/* 3. Halaman Input PIN */}
        <Stack.Screen name="pin-auth" />

        {/* 4. Dashboard Utama (Menu, Transaksi, Laporan) */}
        {/* animation: 'fade' supaya transisi masuk ke dashboard lebih halus */}
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />

      </Stack>
    </>
  );
}