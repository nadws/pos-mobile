import { MaterialCommunityIcons } from '@expo/vector-icons'; // Ikon
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient'; // Untuk background biru gradasi
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();

  // --- STATE (Sama persis dengan Next.js) ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- LOGIC LOGIN ---
  const handleLogin = async () => {
    // Reset Error
    setError("");
    
    // Validasi sederhana
    if (!email || !password) {
      setError("Email dan Password harus diisi");
      return;
    }

    setLoading(true);

    try {
      // ⚠️ PENTING: Ganti URL ini dengan URL Backend Laravel kamu
      // Jangan pakai localhost/127.0.0.1, gunakan URL preview IDX atau IP LAN Laptop
      const response = await axios.post("https://pos.soondobu.com/api/login", {
        email: email,
        password: password,
      });

      // Simpan Token & User (Ganti localStorage dengan AsyncStorage)
      await AsyncStorage.setItem("pos_token", response.data.token);
      await AsyncStorage.setItem("pos_user", JSON.stringify(response.data.user));

      // Redirect ke Dashboard
      // Di Next.js: router.push('/stores') -> Di Mobile kita arahkan ke tab utama dulu
      router.replace('/stores');

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "Login gagal, cek koneksi.";
      setError(errorMessage);
      Alert.alert("Gagal", errorMessage); // Munculkan popup juga biar user sadar
    } finally {
      setLoading(false);
    }
  };

  return (
    // KeyboardAvoidingView agar keyboard tidak menutupi input saat mengetik
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={styles.container}>
          
          {/* BAGIAN ATAS: Header Biru (Adaptasi dari Kolom Kanan Next.js) */}
          <LinearGradient
            colors={['#2563EB', '#1E40AF']} // Blue-600 to Blue-800
            style={styles.headerContainer}
          >
            {/* Efek Blob/Bulatan (Hiasan) */}
            <View style={styles.blob1} />
            <View style={styles.blob2} />

            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                 <MaterialCommunityIcons name="monitor-dashboard" size={40} color="#DBEAFE" />
              </View>
              <Text style={styles.headerTitle}>Sistem POS Pintar</Text>
              <Text style={styles.headerSubtitle}>Kelola toko Anda dalam genggaman</Text>
            </View>
          </LinearGradient>

          {/* BAGIAN BAWAH: Form Login (Adaptasi dari Kolom Kiri Next.js) */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Login</Text>
            <Text style={styles.formSubtitle}>Masuk untuk memulai penjualan.</Text>

            {/* Error Message Box */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Input Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="staff@resto.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Input Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Checkbox & Lupa Password */}
            <View style={styles.optionsRow}>
               {/* Di mobile checkbox agak ribet, kita skip dulu visualnya atau pakai Touchable */}
               <TouchableOpacity>
                 <Text style={styles.optionText}>Ingat saya</Text>
               </TouchableOpacity>
               <TouchableOpacity>
                 <Text style={styles.linkText}>Lupa password?</Text>
               </TouchableOpacity>
            </View>

            {/* Tombol Login */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={[
                styles.button,
                loading && styles.buttonDisabled
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- STYLING (Adaptasi Tailwind ke StyleSheet) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // bg-gray-100
  },
  // Header Styles
  headerContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  blob2: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    color: '#DBEAFE', // blue-100
    fontSize: 14,
  },

  // Form Styles
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: -40, // Supaya naik numpuk header sedikit
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5, // Shadow Android
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827', // gray-900
  },
  formSubtitle: {
    color: '#6B7280', // gray-500
    marginBottom: 24,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: '#FEF2F2', // red-50
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444', // red-500
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
  },
  errorText: {
    color: '#B91C1C', // red-700
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151', // gray-700
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB', // gray-50
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12, // py-3
    fontSize: 16,
    color: '#1F2937',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  optionText: {
    color: '#4B5563', // gray-600
    fontSize: 14,
  },
  linkText: {
    color: '#2563EB', // blue-600
    fontWeight: '600',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#2563EB', // blue-600
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD', // blue-300
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});