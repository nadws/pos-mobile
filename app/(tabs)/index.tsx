import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router'; // Tambahkan useFocusEffect
import React, { useCallback, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("Loading...");
  const [userName, setUserName] = useState("Kasir");
  const [summary, setSummary] = useState({
    revenue: 0,
    transactions: 0,
    items: 0
  });

  useFocusEffect(
    useCallback(() => {
      loadData(); // Panggil fungsi ambil data setiap kali layar dashboard dibuka
    }, [])
  );

  const loadData = async () => {
    try {
      // Ambil data terbaru dari storage
      const storeStr = await AsyncStorage.getItem("pos_store");
      const userStr = await AsyncStorage.getItem("pos_user");
      const token = await AsyncStorage.getItem("pos_token");

      if (storeStr && token) {
        const store = JSON.parse(storeStr);
        setStoreName(store.name);

        // Fetch data terbaru dari API
        const response = await fetch(`https://pos.soondobu.com/api/pos/${store.slug}/reports`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.status === 'success') {
          setSummary({
            // Gunakan total_orders atau revenue sesuai data asli dari API kamu
            revenue: result.data.weekly_revenue, 
            transactions: result.data.total_orders,
            items: 0 
          });
        }
      }
      
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name);
      }
    } catch (e) {
      console.error("Gagal memuat data dashboard", e);
    }
  };

  // Menu Navigasi (Sesuai Fitur Next.js: Dapur & Pesanan)
  const menuItems = [
    { 
      title: 'Dapur', 
      desc: 'Monitor Masakan',
      icon: 'chef-hat', 
      color: '#F59E0B', 
      route: '/kitchen' 
    },
    { 
      title: 'Pesanan', 
      desc: 'Riwayat Transaksi',
      icon: 'receipt', 
      color: '#10B981', 
      route: '/orders' 
    },
    { 
      title: 'Laporan', 
      desc: 'Statistik Penjualan',
      icon: 'chart-bar', 
      color: '#EC4899', 
      route: '/reports' 
    },
    { 
      title: 'Closing', 
      desc: 'Closingan',
      icon: 'close-circle', 
      color: '#EC4899', 
      route: '/closing' 
    },
    { 
      title: 'Ganti Toko', 
      desc: 'Pilih Cabang Lain',
      icon: 'store', 
      color: '#6366F1', 
      route: '/stores' 
    },
  ];

  const handleMenuPress = (route: string) => {
    if (route === '/stores') {
      // Hapus pilihan toko saat ini jika mau ganti
      AsyncStorage.removeItem("pos_store");
      router.replace(route as any);
    } else {
      router.push(route as any);
    }
  };
  const formatRp = (num: number) => "Rp " + num.toLocaleString("id-ID");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      
      {/* HEADER BACKGROUND */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.header}
      >
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

        {/* CARD RINGKASAN (Placeholder) */}
        <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Penjualan Hari Ini</Text>
        <Text style={styles.summaryValue}>{formatRp(summary.revenue)}</Text>
        <View style={styles.summaryRow}>
            <Text style={styles.summarySub}>{summary.transactions} Transaksi</Text>
            <Text style={styles.summarySub}>•</Text>
            <Text style={styles.summarySub}>Aktif</Text>
        </View>
      </View>
      </LinearGradient>

      {/* CONTENT MENU */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Menu Utama</Text>
        
        <View style={styles.grid}>
          {/* TOMBOL KASIR BESAR */}
          <TouchableOpacity 
            style={styles.bigButton} 
            activeOpacity={0.9}
            // Arahkan ke Tab POS (yang akan kita buat nanti)
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

          {/* GRID MENU KECIL */}
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
        
        {/* Spacer agar tidak ketutup Navigasi Bawah */}
        <View style={{height: 100}} />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    padding: 24,
    paddingTop: 50, 
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    height: 220,
    marginBottom: 60, 
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: { color: '#BFDBFE', fontSize: 14, marginBottom: 2 },
  userText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  storeBadge: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
    elevation: 2,
  },
  storeText: { color: '#2563EB', fontWeight: 'bold', fontSize: 12 },
  
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'absolute',
    bottom: -50,
    left: 20,
    right: 20,
  },
  summaryTitle: { color: '#6B7280', fontSize: 14, marginBottom: 4, fontWeight: '500' },
  summaryValue: { color: '#111827', fontSize: 32, fontWeight: 'bold' },
  summaryRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  summarySub: { color: '#10B981', fontWeight: '600', fontSize: 13, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },

  content: { padding: 20, paddingTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  
  bigButton: { width: '100%', marginBottom: 8, borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#2563EB', shadowOpacity: 0.2, shadowOffset: {width:0, height:4} },
  bigButtonGradient: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  bigIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  bigButtonTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  bigButtonDesc: { color: '#DBEAFE', fontSize: 13 },

  menuItem: { 
    width: '48%', 
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 4,
    elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: {width:0, height:2},
    borderWidth: 1, borderColor: '#F3F4F6'
  },
  iconBox: { width: 48, height: 48, borderRadius: 12, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
  menuTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 2 },
  menuDesc: { fontSize: 11, color: '#9CA3AF' },
});