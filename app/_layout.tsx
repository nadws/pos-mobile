import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  // Pastikan ini mengarah ke folder tabs kamu
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Stack ini mengatur navigasi di luar Tab Bar */}
      <Stack screenOptions={{ headerShown: false }}>
        {/* Utama: Tab Navigation */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Halaman di luar Tab Bar: Kitchen, Orders, Payment */}
        {/* Menghilangkan header bawaan agar tidak menumpuk */}
        <Stack.Screen name="kitchen" options={{ headerShown: false }} />
        <Stack.Screen name="orders" options={{ headerShown: false }} />
        <Stack.Screen name="payment" options={{ headerShown: false }} />
        
        {/* Opsional: Jika kamu punya folder 'stores' */}
        <Stack.Screen name="stores" options={{ headerShown: false }} />

        {/* Modal tetap menggunakan header bawaan jika diinginkan */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true, title: 'Informasi' }} />
      </Stack>
      
      {/* StatusBar auto menyesuaikan tema, tapi untuk header biru kamu 
          biasanya lebih bagus pakai style="light" di halaman tersebut */}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}