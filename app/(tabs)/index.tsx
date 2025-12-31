import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios'; // Pastikan pakai axios
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function DashboardScreen() {
  const router = useRouter();
  
  // --- STATE DASHBOARD ---
  const [storeName, setStoreName] = useState("Loading...");
  const [userName, setUserName] = useState("Kasir");
  const [summary, setSummary] = useState({ revenue: 0, transactions: 0 });
  const [loading, setLoading] = useState(true);

  // --- STATE BUKA TOKO (SHIFT) ---
  const [isStoreClosed, setIsStoreClosed] = useState(false);
  const [startCash, setStartCash] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const savedStoreName = await AsyncStorage.getItem("pos_store_name");
      const savedUserName = await AsyncStorage.getItem("pos_user_name");
      const slug = await AsyncStorage.getItem("pos_store_slug");
      const apiUrl = await AsyncStorage.getItem("pos_api_url");
      const token = await AsyncStorage.getItem("pos_token");

      if (savedStoreName) setStoreName(savedStoreName);
      if (savedUserName) setUserName(savedUserName);

      if (slug && token && apiUrl) {
        // 1. CEK STATUS TOKO (Apakah Shift Sudah Dibuka?)
        try {
            const statusRes = await axios.get(`${apiUrl}/pos/${slug}/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Jika toko tutup (is_open = false), munculkan Modal Buka Toko
            if (!statusRes.data.is_open) {
                setIsStoreClosed(true);
                setLoading(false);
                return; // Stop di sini, jangan load report dulu
            } else {
                setIsStoreClosed(false);
            }
        } catch (err) {
            console.log("Gagal cek status toko (mungkin endpoint belum ada)", err);
            // Lanjut saja jika endpoint belum siap (fallback)
        }

        // 2. Fetch Report Dashboard
        const reportRes = await axios.get(`${apiUrl}/pos/${slug}/reports`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (reportRes.data.success || reportRes.data.status === 'success') {
           const data = reportRes.data.data;
           setSummary({
             revenue: data.daily_revenue || 0, 
             transactions: data.total_orders_day || 0
           });
        }
      }
    } catch (e) {
      console.error("Gagal memuat data dashboard", e);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI BUKA TOKO ---
  const handleOpenStore = async () => {
    const cash = parseInt(startCash.replace(/\./g, '')); // Hapus titik format ribuan
    if (isNaN(cash)) {
        Alert.alert("Error", "Masukkan jumlah uang modal awal");
        return;
    }

    setIsOpening(true);
    try {
        const slug = await AsyncStorage.getItem("pos_store_slug");
        const token = await AsyncStorage.getItem("pos_token");
        const apiUrl = await AsyncStorage.getItem("pos_api_url");

        await axios.post(`${apiUrl}/pos/${slug}/open-store`, 
            { start_cash: cash },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        Alert.alert("Berhasil", "Toko telah dibuka! Selamat bekerja.");
        setIsStoreClosed(false);
        loadData(); // Reload data dashboard
    } catch (error) {
        Alert.alert("Gagal", "Tidak bisa membuka toko. Cek koneksi internet.");
    } finally {
        setIsOpening(false);
    }
  };

  // --- NAVIGASI MENU ---
  const menuItems = [
    { title: 'Dapur', desc: 'Monitor Masakan', icon: 'chef-hat', color: '#F59E0B', route: '/kitchen' },
    { title: 'Gudang', desc: 'Ambil Barang', icon: 'warehouse', color: '#8B5CF6', route: '/warehouse' },
    { title: 'Pesanan', desc: 'Riwayat Transaksi', icon: 'receipt', color: '#10B981', route: '/orders' },
    { title: 'Laporan', desc: 'Statistik Penjualan', icon: 'chart-bar', color: '#EC4899', route: '/reports' },
    { title: 'Closing', desc: 'Laporan Akhir Shift', icon: 'file-document-outline', color: '#6366F1', route: '/closing' },
    { title: 'Ganti Toko', desc: 'Scan QR Ulang', icon: 'store-cog', color: '#8B5CF6', route: 'change-store' },
    { title: 'Logout', desc: 'Ganti Karyawan', icon: 'logout', color: '#EF4444', route: 'logout' },
  ];

  const handleMenuPress = async (route: string) => {
    if (route === 'change-store') {
        Alert.alert(
            "Ganti Toko",
            "Anda yakin ingin keluar? Anda harus Scan QR Toko lagi untuk masuk.",
            [
                { text: "Batal", style: "cancel" },
                { 
                    text: "Ya, Ganti", 
                    style: "destructive", 
                    onPress: async () => {
                        await AsyncStorage.clear(); 
                        router.replace('/scan-setup');
                    }
                }
            ]
        );
    } else if (route === 'logout') {
      await AsyncStorage.removeItem("pos_token");
      await AsyncStorage.removeItem("pos_user_name");
      router.replace('/select-user');
    } else {
      router.push(route as any);
    }
  };

  const formatRp = (num: number) => "Rp " + num.toLocaleString("id-ID");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      
      {/* --- HEADER DASHBOARD --- */}
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Selamat Datang,</Text>
            <Text style={styles.userText}>{userName}</Text>
          </View>
          <View style={styles.storeBadge}>
            <MaterialCommunityIcons name="store" size={16} color="#2563EB" />
            <Text style={styles.storeText}>{storeName}</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Penjualan Hari Ini</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <>
              <Text style={styles.summaryValue}>{formatRp(summary.revenue)}</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summarySub}>{summary.transactions} Transaksi</Text>
                <Text style={styles.summarySub}>•</Text>
                <Text style={styles.summarySub}>Aktif</Text>
              </View>
            </>
          )}
        </View>
      </LinearGradient>

      {/* --- MENU GRID --- */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Menu Utama</Text>
        
        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.bigButton} 
            activeOpacity={0.9}
            onPress={() => router.push('/pos')}
          >
            <LinearGradient colors={['#2563EB', '#60A5FA']} style={styles.bigButtonGradient}>
              <View style={styles.bigIconCircle}>
                <MaterialCommunityIcons name="monitor-dashboard" size={32} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.bigButtonTitle}>Buka Kasir</Text>
                <Text style={styles.bigButtonDesc}>Buat Pesanan Baru</Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={24} color="white" style={{marginLeft: 'auto'}} />
            </LinearGradient>
          </TouchableOpacity>

          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => handleMenuPress(item.route)}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={{height: 100}} />
      </ScrollView>

      {/* --- MODAL BUKA TOKO (JIKA TUTUP) --- */}
      <Modal visible={isStoreClosed} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="store-clock-outline" size={50} color="#2563EB" />
                </View>
                
                <Text style={styles.modalTitle}>Buka Toko 🏪</Text>
                <Text style={styles.modalDesc}>
                    Toko saat ini statusnya <Text style={{fontWeight:'bold', color:'#EF4444'}}>TUTUP</Text>. 
                    {'\n'}Masukkan modal awal di laci (Petty Cash) untuk memulai shift.
                </Text>

                <View style={styles.inputWrapper}>
                    <Text style={styles.prefix}>Rp</Text>
                    <TextInput 
                        style={styles.input}
                        placeholder="0"
                        keyboardType="number-pad"
                        value={startCash}
                        onChangeText={(text) => {
                            const num = text.replace(/\D/g, '');
                            setStartCash(Number(num).toLocaleString('id-ID'));
                        }}
                    />
                </View>

                <View style={styles.quickRow}>
                    <TouchableOpacity onPress={() => setStartCash("100.000")} style={styles.quickBtn}>
                        <Text style={styles.quickText}>100k</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setStartCash("200.000")} style={styles.quickBtn}>
                        <Text style={styles.quickText}>200k</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setStartCash("500.000")} style={styles.quickBtn}>
                        <Text style={styles.quickText}>500k</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                    style={[styles.openBtn, isOpening && {opacity: 0.7}]}
                    onPress={handleOpenStore}
                    disabled={isOpening}
                >
                    {isOpening ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.openBtnText}>BUKA TOKO SEKARANG</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace('/select-user')} style={{marginTop: 20}}>
                    <Text style={{color: '#6B7280'}}>Bukan {userName}? Ganti Akun</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  
  // HEADER
  header: { padding: 24, paddingTop: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, height: 220, marginBottom: 60 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { color: '#BFDBFE', fontSize: 14, marginBottom: 2 },
  userText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  storeBadge: { flexDirection: 'row', backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center', gap: 6 },
  storeText: { color: '#2563EB', fontWeight: 'bold', fontSize: 12 },
  
  // SUMMARY CARD
  summaryCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 5, position: 'absolute', bottom: -50, left: 20, right: 20 },
  summaryTitle: { color: '#6B7280', fontSize: 14, marginBottom: 4, fontWeight: '500' },
  summaryValue: { color: '#111827', fontSize: 32, fontWeight: 'bold' },
  summaryRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  summarySub: { color: '#10B981', fontWeight: '600', fontSize: 13, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },

  // CONTENT
  content: { padding: 20, paddingTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  
  // BUTTONS
  bigButton: { width: '100%', marginBottom: 8, borderRadius: 20, overflow: 'hidden', elevation: 4 },
  bigButtonGradient: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  bigIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  bigButtonTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  bigButtonDesc: { color: '#DBEAFE', fontSize: 13 },
  menuItem: { width: '48%', backgroundColor: 'white', padding: 16, borderRadius: 20, marginBottom: 4, elevation: 1, borderWidth: 1, borderColor: '#F3F4F6' },
  iconBox: { width: 48, height: 48, borderRadius: 12, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
  menuTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 2 },
  menuDesc: { fontSize: 11, color: '#9CA3AF' },

  // MODAL STYLES
  modalContainer: { flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 30, alignItems: 'center', elevation: 5 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
  modalDesc: { textAlign: 'center', color: '#6B7280', marginBottom: 30, lineHeight: 22 },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 15, height: 60, width: '100%', marginBottom: 15 },
  prefix: { fontSize: 20, fontWeight: 'bold', color: '#9CA3AF', marginRight: 10 },
  input: { flex: 1, fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 30, width: '100%' },
  quickBtn: { flex: 1, paddingVertical: 10, backgroundColor: 'white', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, alignItems: 'center' },
  quickText: { fontWeight: '600', color: '#4B5563' },

  openBtn: { backgroundColor: '#2563EB', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 3 },
  openBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});