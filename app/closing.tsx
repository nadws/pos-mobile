import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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

      const statusRes = await axios.get(`${apiUrl}/pos/${slug}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statusRes.data.is_open) {
        setStartCash(parseFloat(statusRes.data.data.start_cash));
      }

      const reportRes = await axios.get(`${apiUrl}/pos/${slug}/closing`, {
        headers: { Authorization: `Bearer ${token}` },
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
      Alert.alert(
        "Perhatian",
        "Harap masukkan jumlah uang tunai yang ada di laci.",
      );
      return;
    }

    Alert.alert(
      "Konfirmasi Closing",
      "Apakah Anda yakin ingin menutup toko/shift ini? Anda akan otomatis logout.",
      [
        { text: "Batal", style: "cancel" },
        { text: "TUTUP TOKO", style: "destructive", onPress: processClosing },
      ],
    );
  };

  const processClosing = async () => {
    setSubmitting(true);
    try {
      const slug = await AsyncStorage.getItem("pos_store_slug");
      const token = await AsyncStorage.getItem("pos_token");
      const apiUrl = await AsyncStorage.getItem("pos_api_url");
      const cashValue = parseInt(actualCash.replace(/\D/g, ""));

      await axios.post(
        `${apiUrl}/pos/${slug}/close-store`,
        { end_cash: cashValue },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      Alert.alert("Sukses", "Shift berhasil ditutup. Sampai jumpa!", [
        {
          text: "OK",
          onPress: async () => {
            await AsyncStorage.removeItem("pos_token");
            await AsyncStorage.removeItem("pos_user_name");
            router.replace("/select-user");
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Gagal",
        error.response?.data?.message || "Terjadi kesalahan",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatRp = (num: number) => "Rp " + (num || 0).toLocaleString("id-ID");

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const systemCash = startCash + (report?.cash_total || 0);
  const inputCash = parseInt(actualCash.replace(/\D/g, "")) || 0;
  const difference = inputCash - systemCash;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* HEADER BIRU MELENGKUNG */}
      <View style={styles.blueHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Laporan Closing</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>Rekonsiliasi Kas & Penjualan</Text>
      </View>

      {/* BODY DENGAN MARGIN TOP NEGATIF AGAR CARD MENIMPA HEADER */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD RINGKASAN PENJUALAN */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={20}
              color="#2563EB"
            />
            <Text style={styles.cardTitleText}>Ringkasan Penjualan</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Order Selesai</Text>
            <Text style={styles.infoValue}>
              {report?.total_orders} Transaksi
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order Dibatalkan</Text>
            <Text style={[styles.infoValue, { color: "#EF4444" }]}>
              {report?.cancelled_orders}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Penjualan Tunai</Text>
            <Text style={styles.infoValue}>{formatRp(report?.cash_total)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Penjualan QRIS</Text>
            <Text style={styles.infoValue}>{formatRp(report?.qris_total)}</Text>
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Grand Total Omzet</Text>
            <Text style={styles.totalPrice}>
              {formatRp(report?.grand_total)}
            </Text>
          </View>
        </View>

        {/* CARD REKONSILIASI KAS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="cash-register"
              size={20}
              color="#2563EB"
            />
            <Text style={styles.cardTitleText}>Rekonsiliasi Kas (Laci)</Text>
          </View>

          <View style={styles.reconRow}>
            <Text style={styles.reconLabel}>Modal Awal</Text>
            <Text style={styles.reconValue}>{formatRp(startCash)}</Text>
          </View>
          <View style={styles.reconRow}>
            <Text style={styles.reconLabel}>(+) Tunai Masuk</Text>
            <Text style={styles.reconValue}>
              {formatRp(report?.cash_total)}
            </Text>
          </View>
          <View style={[styles.reconRow, styles.systemTotalRow]}>
            <Text style={styles.systemTotalLabel}>Seharusnya Ada</Text>
            <Text style={styles.systemTotalValue}>{formatRp(systemCash)}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Input Total Uang Fisik</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>Rp</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="number-pad"
                placeholder="0"
                value={actualCash}
                onChangeText={(text) => {
                  const num = text.replace(/\D/g, "");
                  setActualCash(num ? Number(num).toLocaleString("id-ID") : "");
                }}
              />
            </View>
          </View>

          {actualCash !== "" && (
            <View
              style={[
                styles.diffBox,
                difference < 0
                  ? styles.diffError
                  : difference > 0
                    ? styles.diffSuccess
                    : styles.diffNeutral,
              ]}
            >
              <Text style={styles.diffLabel}>
                {difference === 0
                  ? "Status: BALANCE"
                  : difference < 0
                    ? "Selisih Kurang"
                    : "Selisih Lebih"}
              </Text>
              <Text style={styles.diffValue}>{formatRp(difference)}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.closeButton, submitting && { opacity: 0.7 }]}
          onPress={handleCloseStore}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.closeButtonText}>TUTUP SHIFT SEKARANG</Text>
              <MaterialCommunityIcons
                name="logout"
                size={20}
                color="white"
                style={{ marginLeft: 8 }}
              />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", paddingBottom: 30 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  blueHeader: {
    backgroundColor: "#2563EB",
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 50,
    paddingBottom: 60, // Diperlebar agar ada ruang untuk overlapping
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 0,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navBtn: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
  },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginLeft: 50,
    marginTop: 5,
  },

  // Perubahan Utama di Sini
  body: {
    flex: 1,
    marginTop: -40, // Memberikan efek overlap ke area biru
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  cardTitleText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1F2937",
    marginLeft: 8,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoLabel: { color: "#6B7280", fontSize: 14 },
  infoValue: { fontWeight: "600", color: "#1F2937", fontSize: 14 },

  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 12 },

  totalBox: {
    backgroundColor: "#F0F7FF",
    padding: 15,
    borderRadius: 12,
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontWeight: "bold", color: "#2563EB", fontSize: 14 },
  totalPrice: { fontWeight: "800", color: "#2563EB", fontSize: 18 },

  reconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reconLabel: { color: "#4B5563", fontSize: 13 },
  reconValue: { fontWeight: "600", fontSize: 13 },

  systemTotalRow: {
    borderTopWidth: 1,
    borderColor: "#F3F4F6",
    paddingTop: 10,
    marginTop: 5,
  },
  systemTotalLabel: { fontWeight: "bold", color: "#1F2937" },
  systemTotalValue: { fontWeight: "bold", color: "#2563EB", fontSize: 15 },

  inputContainer: { marginTop: 20 },
  inputLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 8,
    fontWeight: "bold",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 15,
    height: 55,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#9CA3AF",
    marginRight: 10,
  },
  textInput: { flex: 1, fontSize: 20, fontWeight: "bold", color: "#1F2937" },

  diffBox: {
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  diffError: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  diffSuccess: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  diffNeutral: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  diffLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  diffValue: { fontSize: 20, fontWeight: "bold", marginTop: 2 },

  closeButton: {
    backgroundColor: "#EF4444",
    flexDirection: "row",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#EF4444",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    marginTop: 10,
  },
  closeButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
