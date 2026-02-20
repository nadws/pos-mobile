import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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
  View,
} from "react-native";

export default function DashboardScreen() {
  const router = useRouter();

  // --- STATE DATA ---
  const [storeName, setStoreName] = useState("Loading...");
  const [userName, setUserName] = useState("Kasir");
  const [summary, setSummary] = useState({ revenue: 0, transactions: 0 });
  const [pendingOrders, setPendingOrders] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- STATE SHIFT/BUKA TOKO ---
  const [isStoreClosed, setIsStoreClosed] = useState(false);
  const [startCash, setStartCash] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  // Helper Format Rupiah
  const formatRp = (num: number) => {
    return "Rp " + (num || 0).toLocaleString("id-ID");
  };

  // Refresh data setiap kali layar difokuskan
  useFocusEffect(
    useCallback(() => {
      loadData();
      const interval = setInterval(() => loadData(true), 10000);
      return () => clearInterval(interval);
    }, []),
  );

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const savedStoreName = await AsyncStorage.getItem("pos_store_name");
      const savedUserName = await AsyncStorage.getItem("pos_user_name");
      const slug = await AsyncStorage.getItem("pos_store_slug");
      const token = await AsyncStorage.getItem("pos_token");
      const apiUrl = "https://uwaispos.online/api";

      if (savedStoreName) setStoreName(savedStoreName);
      if (savedUserName) setUserName(savedUserName);

      if (slug && token) {
        // 1. CEK STATUS TOKO
        const statusRes = await axios.get(`${apiUrl}/pos/${slug}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsStoreClosed(!statusRes.data.is_open);

        if (statusRes.data.is_open) {
          // 2. AMBIL ANTRIAN DAPUR
          const kitchenRes = await axios.get(`${apiUrl}/pos/${slug}/kitchen`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (kitchenRes.data && kitchenRes.data.data) {
            setPendingOrders(kitchenRes.data.data.length);
          }

          // 3. AMBIL LAPORAN
          const reportRes = await axios.get(`${apiUrl}/pos/${slug}/reports`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const reportData = reportRes.data.data;
          setSummary({
            revenue: reportData?.daily_revenue || 0,
            transactions: reportData?.total_orders_day || 0,
          });
        }
      }
    } catch (e) {
      console.error("Gagal load dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("pos_token");
          await AsyncStorage.removeItem("pos_user_name");
          router.replace("/");
        },
      },
    ]);
  };

  const handleOpenStore = async () => {
    const cash = parseInt(startCash.replace(/\./g, ""));
    if (isNaN(cash)) return Alert.alert("Error", "Masukkan modal awal");

    setIsOpening(true);
    try {
      const slug = await AsyncStorage.getItem("pos_store_slug");
      const token = await AsyncStorage.getItem("pos_token");
      await axios.post(
        `https://uwaispos.online/api/pos/${slug}/open-store`,
        { start_cash: cash },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setIsStoreClosed(false);
      loadData();
    } catch (error) {
      Alert.alert("Gagal", "Terjadi kesalahan saat membuka toko.");
    } finally {
      setIsOpening(false);
    }
  };

  const menuItems = [
    {
      title: "Pesanan",
      desc: "Monitor Pesanan",
      icon: "receipt",
      color: "#F59E0B",
      route: "/kitchen",
    },
    {
      title: "Invoice",
      desc: "Riwayat Transaksi",
      icon: "script-text-outline",
      color: "#10B981",
      route: "/orders",
    },
    {
      title: "Laporan",
      desc: "Statistik Penjualan",
      icon: "chart-bar",
      color: "#EC4899",
      route: "/reports",
    },
    {
      title: "Closing",
      desc: "Laporan Akhir Shift",
      icon: "file-lock",
      color: "#6366F1",
      route: "/closing",
    },
    {
      title: "Ganti Toko",
      desc: "Reset Pengaturan",
      icon: "store-cog",
      color: "#8B5CF6",
      route: "/change-store",
    },
    {
      title: "Logout",
      desc: "Keluar Aplikasi",
      icon: "logout",
      color: "#EF4444",
      route: "logout",
    },
  ];

  if (loading && !summary.revenue && !pendingOrders) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />

      <LinearGradient colors={["#1E40AF", "#3B82F6"]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Halo,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <View style={styles.storeBadge}>
            <MaterialCommunityIcons name="store" size={14} color="#1E40AF" />
            <Text style={styles.storeText}>{storeName}</Text>
          </View>
        </View>

        <View style={styles.cardSummary}>
          <Text style={styles.summaryLabel}>Penjualan Hari Ini</Text>
          <Text style={styles.revenueText}>{formatRp(summary.revenue)}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.badgeGreen}>
              <Text style={styles.badgeTextGreen}>
                {summary.transactions} Transaksi
              </Text>
            </View>
            <View style={styles.badgeBlue}>
              <Text style={styles.badgeTextBlue}>Aktif</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.menuScroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Menu Utama</Text>

        <TouchableOpacity
          style={styles.posButton}
          onPress={() => router.push("/pos")}
        >
          <LinearGradient
            colors={["#2563EB", "#60A5FA"]}
            style={styles.posGradient}
          >
            <View style={styles.posIconCircle}>
              <MaterialCommunityIcons
                name="monitor-dashboard"
                size={28}
                color="#2563EB"
              />
            </View>
            <View>
              <Text style={styles.posTitle}>Buka Kasir</Text>
              <Text style={styles.posSub}>Buat pesanan baru</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="white"
              style={{ marginLeft: "auto" }}
            />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuBox}
              onPress={() => {
                if (item.route === "logout") handleLogout();
                else if (item.route === "/change-store") {
                  Alert.alert(
                    "Hapus Data",
                    "Ini akan mereset koneksi toko. Lanjut?",
                    [
                      { text: "Batal" },
                      {
                        text: "Ya",
                        onPress: async () => {
                          await AsyncStorage.clear();
                          router.replace("/");
                        },
                      },
                    ],
                  );
                } else router.push(item.route as any);
              }}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: item.color + "15" },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={26}
                  color={item.color}
                />
                {item.title === "Pesanan" && pendingOrders > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifText}>{pendingOrders}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.menuLabel}>{item.title}</Text>
              <Text style={styles.menuSubLabel}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal visible={isStoreClosed} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons
              name="store-clock-outline"
              size={60}
              color="#2563EB"
            />
            <Text style={styles.modalTitle}>Toko Masih Tutup</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Modal Awal (Rp)"
              keyboardType="numeric"
              value={startCash}
              onChangeText={(t) =>
                setStartCash(
                  Number(t.replace(/\D/g, "")).toLocaleString("id-ID"),
                )
              }
            />
            <TouchableOpacity
              style={styles.btnOpen}
              onPress={handleOpenStore}
              disabled={isOpening}
            >
              {isOpening ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.btnOpenText}>BUKA TOKO</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    height: 200,
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 50,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { color: "#DBEAFE", fontSize: 14 },
  userName: { color: "white", fontSize: 20, fontWeight: "bold" },
  storeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  storeText: { color: "#1E40AF", fontWeight: "bold", fontSize: 12 },
  cardSummary: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    position: "absolute",
    bottom: -40,
    left: 20,
    right: 20,
    elevation: 4,
  },
  summaryLabel: { color: "#64748B", fontSize: 12, fontWeight: "600" },
  revenueText: {
    color: "#1E293B",
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 4,
  },
  summaryRow: { flexDirection: "row", gap: 10, marginTop: 5 },
  badgeGreen: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeTextGreen: { color: "#166534", fontSize: 11, fontWeight: "700" },
  badgeBlue: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeTextBlue: { color: "#1E40AF", fontSize: 11, fontWeight: "700" },
  menuScroll: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 15,
  },
  posButton: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 2,
  },
  posGradient: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  posIconCircle: {
    width: 45,
    height: 45,
    backgroundColor: "white",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  posTitle: { color: "white", fontSize: 16, fontWeight: "bold" },
  posSub: { color: "#DBEAFE", fontSize: 12 },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuBox: {
    width: "48%",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  menuLabel: { fontSize: 14, fontWeight: "bold", color: "#334155" },
  menuSubLabel: { fontSize: 10, color: "#94A3B8", marginTop: 2 },
  notifBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  notifText: { color: "white", fontSize: 10, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "white",
    borderRadius: 25,
    padding: 30,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },
  modalInput: {
    width: "100%",
    backgroundColor: "#F1F5F9",
    padding: 15,
    borderRadius: 10,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
  },
  btnOpen: {
    backgroundColor: "#2563EB",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  btnOpenText: { color: "white", fontWeight: "bold" },
});
