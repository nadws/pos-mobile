import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert, SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function ClosingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [actualCash, setActualCash] = useState("");
  const [startCash, setStartCash] = useState(0);

  useEffect(() => {
    fetchClosingData();
  }, []);

  const fetchClosingData = async () => {
    try {
      const slug = await AsyncStorage.getItem("pos_store_slug");
      const token = await AsyncStorage.getItem("pos_token");
      const apiUrl = await AsyncStorage.getItem("pos_api_url");

      // 1. Ambil Data Register (untuk tahu modal awal)
      const statusRes = await axios.get(`${apiUrl}/pos/${slug}/status`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (statusRes.data.is_open) {
          setStartCash(parseFloat(statusRes.data.data.start_cash));
      }

      // 2. Ambil Laporan Penjualan Hari Ini
      const reportRes = await axios.get(`${apiUrl}/pos/${slug}/closing`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      
      setReport(reportRes.data.data);
    } catch (error) {
      Alert.alert("Error", "Gagal mengambil data closing.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleCloseStore = async () => {
    if (!actualCash) {
        Alert.alert("Perhatian", "Harap masukkan jumlah uang tunai yang ada di laci.");
        return;
    }

    Alert.alert(
        "Konfirmasi Closing",
        "Apakah Anda yakin ingin menutup toko/shift ini? Anda tidak bisa membatalkan aksi ini.",
        [
            { text: "Batal", style: "cancel" },
            { 
                text: "TUTUP TOKO", 
                style: "destructive",
                onPress: processClosing
            }
        ]
    );
  };

  const processClosing = async () => {
    console.log("Memulai proses closing..."); // Cek di terminal
    setSubmitting(true);
    
    try {
        const slug = await AsyncStorage.getItem("pos_store_slug");
        const token = await AsyncStorage.getItem("pos_token");
        const apiUrl = await AsyncStorage.getItem("pos_api_url");
        
        // Hapus titik ribuan agar jadi integer
        const cashValue = parseInt(actualCash.replace(/\D/g, ''));
        
        console.log("Mengirim data ke:", `${apiUrl}/pos/${slug}/close-store`);
        console.log("Data:", { end_cash: cashValue });

        const response = await axios.post(`${apiUrl}/pos/${slug}/close-store`, 
            { end_cash: cashValue },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Respon Sukses:", response.data);

        Alert.alert("Sukses", "Shift berhasil ditutup. Sampai jumpa!", [
            { text: "OK", onPress: async () => {
                await AsyncStorage.removeItem("pos_token");
                await AsyncStorage.removeItem("pos_user_name");
                router.replace('/select-user');
            }}
        ]);
    } catch (error: any) {
        // --- INI BAGIAN PENTINGNYA ---
        console.error("ERROR CLOSING:", error);
        
        if (error.response) {
            // Error dari Server (Laravel)
            console.error("Server Response:", error.response.data);
            Alert.alert("Gagal Server", error.response.data.message || "Terjadi kesalahan di server");
        } else if (error.request) {
            // Tidak ada respon (Koneksi putus)
            Alert.alert("Gagal Koneksi", "Tidak dapat menghubungi server. Cek internet.");
        } else {
            // Error kodingan JS
            Alert.alert("Gagal Aplikasi", error.message);
        }
    } finally {
        setSubmitting(false);
    }
};

  const formatRp = (num: number) => "Rp " + num.toLocaleString("id-ID");

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;

  // Hitung Total yang Seharusnya Ada di Laci
  // Rumus: Modal Awal + Penjualan Tunai
  const systemCash = startCash + (report?.cash_total || 0);
  const inputCash = parseInt(actualCash.replace(/\D/g, '')) || 0;
  const difference = inputCash - systemCash;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.header}>
         <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>Laporan Closing</Text>
         <View style={{width: 30}} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
         
         {/* RINGKASAN PENJUALAN */}
         <View style={styles.card}>
            <Text style={styles.cardTitle}>Ringkasan Penjualan</Text>
            <View style={styles.row}>
                <Text style={styles.label}>Total Order Selesai</Text>
                <Text style={styles.value}>{report?.total_orders}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Order Dibatalkan</Text>
                <Text style={[styles.value, {color: '#EF4444'}]}>{report?.cancelled_orders}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
                <Text style={styles.label}>Penjualan Tunai</Text>
                <Text style={styles.value}>{formatRp(report?.cash_total)}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Penjualan QRIS</Text>
                <Text style={styles.value}>{formatRp(report?.qris_total)}</Text>
            </View>
            <View style={[styles.row, {marginTop: 10}]}>
                <Text style={styles.totalLabel}>Grand Total Omzet</Text>
                <Text style={styles.totalValue}>{formatRp(report?.grand_total)}</Text>
            </View>
         </View>

         {/* REKONSILIASI KAS (CASH RECONCILIATION) */}
         <View style={styles.card}>
            <Text style={styles.cardTitle}>Rekonsiliasi Kas (Laci)</Text>
            
            <View style={styles.reconRow}>
                <Text style={styles.reconLabel}>Modal Awal</Text>
                <Text style={styles.reconValue}>{formatRp(startCash)}</Text>
            </View>
            <View style={styles.reconRow}>
                <Text style={styles.reconLabel}>(+) Tunai Masuk</Text>
                <Text style={styles.reconValue}>{formatRp(report?.cash_total)}</Text>
            </View>
            <View style={[styles.reconRow, {borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 8, marginTop: 5}]}>
                <Text style={[styles.reconLabel, {fontWeight: 'bold'}]}>Seharusnya Ada</Text>
                <Text style={[styles.reconValue, {color: '#2563EB'}]}>{formatRp(systemCash)}</Text>
            </View>

            {/* INPUT UANG AKTUAL */}
            <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Masukkan Total Uang Fisik di Laci</Text>
                <View style={styles.inputWrapper}>
                    <Text style={styles.prefix}>Rp</Text>
                    <TextInput 
                        style={styles.input}
                        keyboardType="number-pad"
                        placeholder="0"
                        value={actualCash}
                        onChangeText={(text) => {
                            const num = text.replace(/\D/g, '');
                            setActualCash(Number(num).toLocaleString('id-ID'));
                        }}
                    />
                </View>
            </View>

            {/* SELISIH */}
            {actualCash !== "" && (
                <View style={[styles.diffBox, difference < 0 ? styles.diffError : difference > 0 ? styles.diffSuccess : styles.diffNeutral]}>
                    <Text style={styles.diffLabel}>{difference === 0 ? "Klop / Seimbang" : difference < 0 ? "Selisih Kurang (Minus)" : "Selisih Lebih (Plus)"}</Text>
                    <Text style={styles.diffValue}>{formatRp(difference)}</Text>
                </View>
            )}
         </View>

         <TouchableOpacity 
            style={[styles.closeBtn, submitting && {opacity: 0.7}]}
            onPress={handleCloseStore}
            disabled={submitting}
         >
            {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.closeBtnText}>TUTUP SHIFT SEKARANG</Text>}
         </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 5 },

  content: { padding: 20 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: '#6B7280', fontSize: 14 },
  value: { fontWeight: '600', color: '#1F2937' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },
  totalLabel: { fontWeight: 'bold', fontSize: 16, color: '#1F2937' },
  totalValue: { fontWeight: 'bold', fontSize: 18, color: '#2563EB' },

  reconRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reconLabel: { color: '#4B5563' },
  reconValue: { fontWeight: 'bold' },

  inputSection: { marginTop: 20, backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12 },
  inputLabel: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#D1D5DB' },
  prefix: { fontSize: 18, fontWeight: 'bold', color: '#9CA3AF', marginRight: 10 },
  input: { flex: 1, fontSize: 24, fontWeight: 'bold', color: '#1F2937' },

  diffBox: { marginTop: 15, padding: 12, borderRadius: 8, alignItems: 'center' },
  diffError: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECaca' },
  diffSuccess: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  diffNeutral: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  diffLabel: { fontSize: 12, fontWeight: 'bold', color: '#374151' },
  diffValue: { fontSize: 18, fontWeight: 'bold', marginTop: 2, color: '#1F2937' },

  closeBtn: { backgroundColor: '#EF4444', padding: 18, borderRadius: 12, alignItems: 'center', elevation: 3, marginBottom: 30 },
  closeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});