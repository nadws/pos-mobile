import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function ClosingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [uangAwal, setUangAwal] = useState('0');
  
  // State untuk identitas toko dan kasir
  const [storeName, setStoreName] = useState("Toko");
  const [userName, setUserName] = useState("Kasir");

  useEffect(() => {
    fetchClosingData();
  }, []);

  const fetchClosingData = async () => {
    try {
      const slug = await AsyncStorage.getItem("pos_store_slug");
      const token = await AsyncStorage.getItem("pos_token");
      
      // Ambil data store dan user dari storage untuk nama di laporan WA
      const storeData = await AsyncStorage.getItem("pos_store");
      const userData = await AsyncStorage.getItem("pos_user");

      if (storeData) {
        const parsedStore = JSON.parse(storeData);
        setStoreName(parsedStore.name || "Toko");
      }
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUserName(parsedUser.name || "Kasir");
      }

      const response = await axios.get(`https://pos.soondobu.com/api/pos/${slug}/closing`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal mengambil data closing");
    } finally {
      setLoading(false);
    }
  };

  const formatRp = (num: number) => "Rp " + (num || 0).toLocaleString("id-ID");

  // Hitung total uang yang harus ada di laci (Cash Penjualan + Uang Awal)
  const totalDiLaci = (data?.cash_total || 0) + parseInt(uangAwal || '0');

  const handleKonfirmasiTutupToko = () => {
    // 1. Validasi input uang awal
    if (!uangAwal || uangAwal === '') {
      Alert.alert("Perhatian", "Mohon isi uang modal awal laci terlebih dahulu (isi 0 jika tidak ada).");
      return;
    }

    // 2. Format Pesan WhatsApp
    const pesan = 
      `*LAPORAN TUTUP KASIR - ${data?.date}*\n` +
      `------------------------------------------\n` +
      `🏪 *Toko:* ${storeName}\n` +
      `👤 *Kasir:* ${userName}\n\n` +
      `💰 *TOTAL PENJUALAN:* ${formatRp(data?.grand_total)}\n` +
      `💵 Cash: ${formatRp(data?.cash_total)}\n` +
      `📱 QRIS: ${formatRp(data?.qris_total)}\n` +
      `------------------------------------------\n` +
      `🏧 *RINCIAN KAS LACI:*\n` +
      `Modal Awal: ${formatRp(parseInt(uangAwal))}\n` +
      `Hasil Cash: ${formatRp(data?.cash_total)}\n` +
      `*TOTAL FISIK LACI: ${formatRp(totalDiLaci)}*\n` +
      `------------------------------------------\n` +
      `✅ Pesanan Berhasil: ${data?.total_orders}\n` +
      `❌ Pesanan Dibatalkan: ${data?.cancelled_orders}\n\n` +
      `_Laporan dikirim otomatis dari sistem POS._`;

    // 3. Nomor WhatsApp Owner (Ganti dengan nomor owner asli)
    const nomorOwner = "6285751609104"; 
    const url = `whatsapp://send?phone=${nomorOwner}&text=${encodeURIComponent(pesan)}`;

    // 4. Munculkan Dialog Konfirmasi
    Alert.alert(
      "Konfirmasi Tutup Toko",
      `Pastikan uang fisik di laci sesuai: ${formatRp(totalDiLaci)}`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Tutup & Kirim WA", 
          onPress: () => {
            Linking.openURL(url).catch(() => {
              Alert.alert("Error", "Pastikan WhatsApp terinstal di HP kamu.");
            });
            // Opsional: Kembali ke dashboard atau logout
            router.replace('/(tabs)');
          } 
        }
      ]
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" translucent />

      {/* HEADER BIRU MELENGKUNG */}
      <View style={styles.headerContainer}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Tutup Kasir / Closing</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.labelSub}>Laporan Hari Ini</Text>
          <Text style={styles.labelMain}>{data?.date}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* INPUT UANG AWAL */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <MaterialCommunityIcons name="wallet" size={20} color="#2563EB" />
            <Text style={styles.inputLabel}>Uang Modal Awal (Laci)</Text>
          </View>
          <TextInput
            style={styles.textInput}
            keyboardType="numeric"
            value={uangAwal}
            onChangeText={(val) => setUangAwal(val.replace(/[^0-9]/g, ''))}
            placeholder="0"
          />
          <Text style={styles.inputHint}>* Uang kembalian yang ada di laci saat toko buka.</Text>
        </View>

        {/* RINGKASAN OMZET */}
        <View style={styles.cardMain}>
          <Text style={styles.cardLabel}>Total Penjualan Hari Ini</Text>
          <Text style={styles.grandTotalText}>{formatRp(data?.grand_total)}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.methodLabel}>Cash (Penjualan)</Text>
            <Text style={styles.methodValue}>{formatRp(data?.cash_total)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.methodLabel}>QRIS (Digital)</Text>
            <Text style={styles.methodValue}>{formatRp(data?.qris_total)}</Text>
          </View>

          <View style={[styles.row, styles.highlightRow]}>
            <Text style={[styles.methodLabel, {color: '#111827', fontWeight: 'bold'}]}>TOTAL DI LACI</Text>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.totalLaciValue}>{formatRp(totalDiLaci)}</Text>
                <Text style={{ fontSize: 10, color: '#9CA3AF' }}>(Cash + Modal)</Text>
            </View>
          </View>
        </View>

        {/* TOMBOL KONFIRMASI */}
        <TouchableOpacity 
          style={styles.btnFinish} 
          onPress={handleKonfirmasiTutupToko}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="whatsapp" size={24} color="white" />
          <Text style={styles.btnText}>Konfirmasi & Kirim WA</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerNote}>Pastikan uang fisik di laci sesuai dengan perhitungan di atas sebelum konfirmasi.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  labelMain: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  content: { flex: 1, marginTop: -30, paddingHorizontal: 20 },
  
  inputCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  inputHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  textInput: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, fontSize: 18, fontWeight: 'bold', color: '#111827' },
  inputHint: { fontSize: 11, color: '#9CA3AF', marginTop: 8 },

  cardMain: { backgroundColor: 'white', borderRadius: 20, padding: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  cardLabel: { color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 5 },
  grandTotalText: { color: '#111827', fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  methodLabel: { fontSize: 14, color: '#6B7280' },
  methodValue: { fontSize: 15, fontWeight: '600', color: '#111827' },
  highlightRow: { marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  totalLaciValue: { fontSize: 22, fontWeight: 'bold', color: '#059669' },

  btnFinish: { backgroundColor: '#25D366', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18, borderRadius: 18, marginTop: 25, gap: 12, elevation: 4 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  footerNote: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 15, paddingHorizontal: 20 }
});