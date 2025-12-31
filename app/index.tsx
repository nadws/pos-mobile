import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, StatusBar,
  StyleSheet,
  Text, TouchableOpacity,
  View
} from 'react-native';

export default function IndexScreen() {
  const router = useRouter();
  const [loadingCheck, setLoadingCheck] = useState(true);

  // --- 1. BAGIAN LOGIKA (SATPAM) ---
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      // Cek apakah ada data tersimpan di HP
      const token = await AsyncStorage.getItem("pos_token");
      const storeSlug = await AsyncStorage.getItem("pos_store_slug");

      if (token) {
        // KASUS A: Sudah Login -> Langsung masuk Dashboard
        router.replace('/(tabs)');
      } else if (storeSlug) {
        // KASUS B: Sudah Scan Toko, tapi Logout -> Masuk Pilih User
        router.replace('/select-user');
      } else {
        // KASUS C: Belum ada apa-apa -> Tampilkan Halaman Setup (UI Kamu)
        setLoadingCheck(false);
      }
    } catch (e) {
      setLoadingCheck(false);
    }
  };

  // Tampilan Loading saat "Satpam" bekerja
  if (loadingCheck) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  // --- 2. BAGIAN TAMPILAN (UI KAMU YANG KEREN) ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Bagian Atas: Gambar / Ilustrasi */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.header}
      >
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="store-cog" size={80} color="#1E40AF" />
        </View>
        <Text style={styles.title}>Setup Toko</Text>
        <Text style={styles.subtitle}>Hubungkan aplikasi ini dengan{'\n'}Sistem Admin Anda</Text>
      </LinearGradient>

      {/* Bagian Bawah: Instruksi & Tombol */}
      <View style={styles.content}>
        <View style={styles.stepContainer}>
          <View style={styles.stepItem}>
            <MaterialCommunityIcons name="monitor-dashboard" size={24} color="#6B7280" />
            <Text style={styles.stepText}>Buka Dashboard Admin di Laptop/PC</Text>
          </View>
          <View style={styles.line} />
          <View style={styles.stepItem}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#6B7280" />
            <Text style={styles.stepText}>Cari Menu "Setup Toko" & Tampilkan QR</Text>
          </View>
          <View style={styles.line} />
          <View style={styles.stepItem}>
            <MaterialCommunityIcons name="cellphone" size={24} color="#6B7280" />
            <Text style={styles.stepText}>Scan QR Code menggunakan HP ini</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.button}
          activeOpacity={0.8}
          // Tombol ini akan membuka kamera
          onPress={() => router.push('/scan-setup')} 
        >
          <MaterialCommunityIcons name="qrcode-scan" size={24} color="white" style={{marginRight: 10}} />
          <Text style={styles.buttonText}>Scan QR Sekarang</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  container: { flex: 1, backgroundColor: 'white' },
  header: {
    height: '45%',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 140,
    height: 140,
    backgroundColor: 'white',
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#DBEAFE', textAlign: 'center', lineHeight: 22 },
  
  content: { flex: 1, padding: 30, justifyContent: 'space-between' },
  stepContainer: { marginTop: 20 },
  stepItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  stepText: { fontSize: 14, color: '#374151', marginLeft: 15, fontWeight: '500' },
  line: { height: 20, width: 2, backgroundColor: '#E5E7EB', marginLeft: 11, marginVertical: 2 },
  
  button: {
    backgroundColor: '#1E40AF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 15,
    elevation: 3,
    marginBottom: 20
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});