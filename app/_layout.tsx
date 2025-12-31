import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  
  // State untuk Splash Screen
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Jalankan fungsi cek storage + timer splash screen
    prepareApp();
  }, []);

  // Kita gunakan useEffect kedua untuk memantau navigasi setelah Splash selesai
  useEffect(() => {
    if (!isSplashVisible && isReady) {
      checkNavigation();
    }
  }, [isSplashVisible, isReady, segments]);

  const prepareApp = async () => {
    try {
      // 1. Tahan Splash Screen selama 3 Detik (agar user lihat brand kita)
      // Kamu bisa ubah angka 3000 (3 detik) sesuai selera
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 2. Tandai aplikasi siap
      setIsReady(true);
    } catch (e) {
      console.warn(e);
    } finally {
      // 3. Hilangkan Splash Screen
      setIsSplashVisible(false);
    }
  };

  const checkNavigation = async () => {
    const slug = await AsyncStorage.getItem("pos_store_slug");
    const token = await AsyncStorage.getItem("pos_token");
    
    const inTabsGroup = segments[0] === '(tabs)';
    const isAuthPage = segments[0] === 'select-user' || segments[0] === 'pin-auth';

    // --- PERUBAHAN DI SINI ---
    
    // 1. Jika BELUM scan QR
    if (!slug) {
       // Izinkan user berada di halaman 'welcome' ATAU 'scan-setup'
       // Jika user tidak di salah satu halaman itu, lempar ke 'welcome'
       if (segments[0] !== 'welcome' && segments[0] !== 'scan-setup') {
          router.replace('/welcome');
       }
    }
    
    // 2. Jika sudah scan tapi belum login
    else if (slug && !token) {
      if (inTabsGroup) router.replace('/select-user');
    }
    
    // 3. Jika sudah login
    else if (slug && token) {
      if (isAuthPage || segments[0] === 'scan-setup' || segments[0] === 'welcome') {
         router.replace('/(tabs)');
      }
    }
};

  // --- TAMPILAN SPLASH SCREEN ---
  if (isSplashVisible) {
    return (
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']} // Warna Biru Khas Aplikasi Kita
        style={styles.splashContainer}
      >
        <View style={styles.logoContainer}>
          {/* Kamu bisa ganti icon ini dengan Image Logo Toko kamu */}
          <View style={styles.iconCircle}>
             <MaterialCommunityIcons name="point-of-sale" size={60} color="#1E40AF" />
          </View>
          
          <Text style={styles.appName}>Uwais Tech POS</Text>
          <Text style={styles.appTagline}>Sistem Kasir Pintar</Text>
        </View>

        <View style={styles.footer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Memuat Data...</Text>
          <Text style={styles.version}>Versi 1.0.0</Text>
        </View>
      </LinearGradient>
    );
  }

  // --- TAMPILAN UTAMA APLIKASI ---
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="scan-setup" />
      <Stack.Screen name="select-user" />
      <Stack.Screen name="pin-auth" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  iconCircle: {
    width: 120,
    height: 120,
    backgroundColor: 'white',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 10, // Efek bayangan
    shadowColor: 'black',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 }
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: 16,
    color: '#BFDBFE', // Biru muda
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 14,
  },
  version: {
    color: '#93C5FD',
    marginTop: 20,
    fontSize: 12,
  }
});