import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const slug = await AsyncStorage.getItem("pos_store_slug");
      const token = await AsyncStorage.getItem("pos_token");
      
      const response = await axios.get(`https://pos.soondobu.com/api/pos/${slug}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allOrders = response.data.data.latest_orders || [];
      const foundOrder = allOrders.find((o: any) => o.id.toString() === id);
      
      setOrder(foundOrder);
    } catch (error) {
      console.error("Gagal ambil detail pesanan", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Batalkan Pesanan",
      "Apakah Anda yakin ingin membatalkan pesanan ini? Data omzet akan berkurang.",
      [
        { text: "Kembali", style: "cancel" },
        { 
          text: "Ya, Batalkan", 
          style: "destructive",
          onPress: async () => {
            try {
              const slug = await AsyncStorage.getItem("pos_store_slug");
              const token = await AsyncStorage.getItem("pos_token");
              
              const response = await axios.post(
                `https://pos.soondobu.com/api/pos/${slug}/orders/${id}/cancel`, 
                {}, 
                { headers: { Authorization: `Bearer ${token}` } }
              );
  
              if (response.data.status === 'success') {
                // UPDATE STATE LOKAL AGAR WARNA LANGSUNG BERUBAH KE MERAH
                setOrder((prev: any) => ({ ...prev, status: 'cancelled' }));
                Alert.alert("Berhasil", "Pesanan telah dibatalkan");
              }
            } catch (error) {
              Alert.alert("Gagal", "Terjadi kesalahan saat membatalkan pesanan");
            }
          }
        }
      ]
    );
  };

  const formatRp = (num: number) => "Rp " + (num || 0).toLocaleString("id-ID");

  // Fungsi Warna Status (Dipanggil di dalam render agar aman)
  const getStatusStyles = (status: string) => {
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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
  if (!order) return <View style={styles.center}><Text>Pesanan tidak ditemukan</Text></View>;

  // Ambil style setelah dipastikan order ada
  const statusStyle = getStatusStyles(order.status);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Transaksi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusCard}>
          <Text style={styles.invoiceLabel}>Nomor Invoice</Text>
          <Text style={styles.invoiceValue}>{order.invoice_number || `#${order.id}`}</Text>
          
          {/* Badge dinamis mengikuti status terbaru */}
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
              {order.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informasi Pelanggan</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account" size={20} color="#6B7280" />
            <Text style={styles.infoText}>{order.customer_name || 'Pelanggan Umum'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#6B7280" />
            <Text style={styles.infoText}>{new Date(order.created_at).toLocaleString('id-ID')}</Text>
          </View>
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Rincian Pesanan</Text>
          {order.items?.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product?.name || item.product_name || 'Menu'}</Text>
                <Text style={styles.itemSub}>{item.quantity || item.qty} x {formatRp(item.price)}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatRp((item.quantity || item.qty) * item.price)}</Text>
            </View>
          ))}
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Bayar</Text>
            <Text style={styles.totalValue}>{formatRp(order.total_price)}</Text>
          </View>
          <Text style={styles.paymentMethod}>Metode: {order.payment_method?.toUpperCase() || 'CASH'}</Text>
        </View>

        {/* Tombol sembunyi otomatis jika status dibatalkan */}
        {order.status !== 'cancelled' && (
          <>
            <TouchableOpacity style={styles.printButton}>
              <MaterialCommunityIcons name="printer" size={24} color="white" />
              <Text style={styles.printButtonText}>Cetak Struk</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
              <Text style={styles.cancelButtonText}>Batalkan Pesanan</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    backgroundColor: '#2563EB', 
    paddingTop: Platform.OS === 'android' ? 50 : 50, 
    paddingBottom: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  statusCard: { backgroundColor: 'white', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, elevation: 2 },
  invoiceLabel: { color: '#6B7280', fontSize: 12 },
  invoiceValue: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginVertical: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontWeight: 'bold', fontSize: 12 },
  infoSection: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#374151', marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoText: { color: '#4B5563', fontSize: 14 },
  itemsSection: { backgroundColor: 'white', borderRadius: 20, padding: 20 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  itemSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  itemTotal: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#2563EB' },
  paymentMethod: { textAlign: 'right', color: '#9CA3AF', fontSize: 12, marginTop: 8 },
  printButton: { backgroundColor: '#111827', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 16, marginTop: 25, gap: 10 },
  printButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2', gap: 8 },
  cancelButtonText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
});