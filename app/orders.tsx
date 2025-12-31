import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router'; // Tambah useFocusEffect
import React, { useCallback, useState } from 'react'; // Tambah useCallback
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Gunakan useFocusEffect agar data refresh otomatis saat kembali dari Detail/Batal
  useFocusEffect(
    useCallback(() => {
      fetchHistory(true);
    }, [])
  );

  const fetchHistory = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const slug = await AsyncStorage.getItem("pos_store_slug");
      const token = await AsyncStorage.getItem("pos_token");
      
      const response = await axios.get(`https://pos.soondobu.com/api/pos/${slug}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data.data;
      const history = data.latest_orders || data.orders || [];
      
      setOrders(history);
    } catch (error) {
      console.error("Gagal ambil history", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatRp = (num: number) => "Rp " + (num || 0).toLocaleString("id-ID");

  // Helper untuk menentukan warna badge berdasarkan status
  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'ready':
        return { bg: '#D1FAE5', text: '#059669' }; // Hijau
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#EF4444' }; // Merah
      default:
        return { bg: '#FEF3C7', text: '#D97706' }; // Kuning
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusStyle = getStatusConfig(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7} 
        onPress={() => router.push(`/order-detail/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.invoiceBox}>
            <MaterialCommunityIcons name="receipt" size={16} color="#2563EB" />
            <Text style={styles.invoiceText}>{item.invoice_number || `#${item.id}`}</Text>
          </View>
          
          {/* Badge dinamis dengan warna yang selaras */}
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{item.customer_name || 'Pelanggan Umum'}</Text>
            <Text style={styles.dateText}>
              {new Date(item.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} • 
              {item.payment_method?.toUpperCase() || 'CASH'}
            </Text>
          </View>
          <Text style={[styles.totalText, item.status === 'cancelled' && styles.textStrike]}>
            {formatRp(item.total_price)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" translucent />

      <View style={styles.headerContainer}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Riwayat Pesanan</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.labelSub}>Transaksi Hari Ini</Text>
          <Text style={styles.labelMain}>{orders.length} Pesanan</Text>
        </View>
      </View>

      <View style={styles.bodyContainer}>
        {loading && !refreshing ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(); }} tintColor="#2563EB" />
            }
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={60} color="#E5E7EB" />
                <Text style={styles.emptyTitle}>Belum ada riwayat hari ini</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  headerContainer: { 
    backgroundColor: '#2563EB', 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 50, 
    paddingBottom: 40, 
    paddingHorizontal: 20, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30 
  },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  iconBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
  headerInfo: { marginTop: 20 },
  labelSub: { color: '#BFDBFE', fontSize: 14 },
  labelMain: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  bodyContainer: { flex: 1, marginTop: -30, paddingHorizontal: 20 },
  card: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 12, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 5, 
    shadowOffset: { width: 0, height: 2 } 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6', 
    paddingBottom: 10, 
    marginBottom: 10 
  },
  invoiceBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  invoiceText: { color: '#2563EB', fontWeight: 'bold', fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  customerName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  dateText: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  totalText: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  textStrike: { textDecorationLine: 'line-through', color: '#9CA3AF' }, // Garis coret untuk pesanan batal
  emptyCard: { backgroundColor: 'white', borderRadius: 20, padding: 40, alignItems: 'center', marginTop: 20 },
  emptyTitle: { color: '#9CA3AF', marginTop: 10, fontWeight: '500' }
});