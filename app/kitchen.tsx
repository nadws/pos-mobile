import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// URL Suara Pilihanmu
const NOTIF_URL =
  "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3";

interface OrderItem {
  id: number;
  quantity: number;
  status: string;
  note?: string;
  product?: { name: string };
  product_name?: string;
}

interface Order {
  id: number;
  customer_name: string;
  created_at: string;
  table_number?: string;
  status: string;
  items: OrderItem[];
}

export default function KitchenScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastOrderCount = useRef(0);

  // 1. FUNGSI MEMUTAR SUARA
  async function playNotificationSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: NOTIF_URL },
        { shouldPlay: true, volume: 1.0 },
      );
      // Lepas memori setelah suara selesai putar
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log("Gagal memutar suara:", error);
    }
  }

  // 2. AMBIL DATA DARI SERVER
  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const slug = await AsyncStorage.getItem("pos_store_slug");
      const token = await AsyncStorage.getItem("pos_token");
      if (!slug || !token) return;

      const response = await axios.get(
        `https://pos.soondobu.com/api/pos/${slug}/kitchen`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const newOrders = response.data.data || [];

      // LOGIKA NOTIFIKASI:
      // Bunyi jika pesanan bertambah dibanding pengecekan terakhir
      if (
        newOrders.length > lastOrderCount.current &&
        lastOrderCount.current !== 0
      ) {
        playNotificationSound();
      }

      lastOrderCount.current = newOrders.length;
      setOrders(newOrders);
    } catch (error) {
      console.error("Gagal ambil data dapur:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 3. SET TIMER REFRESH OTOMATIS
  useEffect(() => {
    fetchOrders();
    // Cek pesanan setiap 7 detik agar tidak terlalu membebani server
    intervalRef.current = setInterval(() => {
      fetchOrders(true);
    }, 7000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleMarkItemReady = async (itemId: number) => {
    try {
      const token = await AsyncStorage.getItem("pos_token");

      // Simpan URL ke variabel biar gampang dicek
      const url = `https://pos.soondobu.com/api/order-items/${itemId}/ready`;
      console.log("Menembak URL:", url); // Cek apakah ID-nya undefined?

      await axios.post(
        url,
        {}, // Body kosong
        { headers: { Authorization: `Bearer ${token}` } },
      );

      fetchOrders(true);
    } catch (error: any) {
      // INI BAGIAN PENTING:
      // Cek respon dari server (Laravel)
      if (error.response) {
        console.error("Server Error:", error.response.status); // Contoh: 404, 500, 405
        console.error("Pesan Server:", error.response.data); // Pesan error dari Laravel
      } else {
        console.error("Network/Code Error:", error.message);
      }

      // Tetap munculkan alert ke user (opsional)
      alert(
        "Gagal update: " + (error.response?.data?.message || "Cek koneksi"),
      );
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#2563EB"
        translucent
      />

      {/* HEADER BIRU MELENGKUNG */}
      <View style={styles.headerContainer}>
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Dapur Soondobu</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.labelWelcome}>Pesanan Aktif</Text>
          <Text style={styles.labelCount}>{orders.length} Antrian</Text>
        </View>
      </View>

      <View style={styles.bodyContainer}>
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchOrders()}
                tintColor="#2563EB"
              />
            }
          >
            {orders.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons
                  name="chef-hat"
                  size={60}
                  color="#E5E7EB"
                />
                <Text style={styles.emptyTitle}>Belum ada pesanan masuk</Text>
              </View>
            ) : (
              orders.map((order) => (
                <View key={order.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.customerName}>
                        {order.customer_name || "Pelanggan"}
                      </Text>
                      <Text style={styles.timeText}>
                        #{order.id} • {formatTime(order.created_at)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.typeBadge,
                        {
                          backgroundColor: order.table_number
                            ? "#DBEAFE"
                            : "#FEE2E2",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeText,
                          { color: order.table_number ? "#2563EB" : "#EF4444" },
                        ]}
                      >
                        {order.table_number
                          ? `Meja ${order.table_number}`
                          : "Bawa Pulang"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {order.items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.itemRow}
                      onPress={() =>
                        item.status !== "done" && handleMarkItemReady(item.id)
                      }
                    >
                      <View
                        style={[
                          styles.checkBox,
                          item.status === "done"
                            ? styles.checkActive
                            : styles.checkInactive,
                        ]}
                      >
                        {item.status === "done" && (
                          <MaterialCommunityIcons
                            name="check"
                            size={12}
                            color="white"
                          />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.itemText,
                            item.status === "done" && styles.textStrike,
                          ]}
                        >
                          <Text
                            style={{ fontWeight: "bold", color: "#2563EB" }}
                          >
                            {item.quantity}x{" "}
                          </Text>
                          {item.product?.name || item.product_name}
                        </Text>
                        {item.note && (
                          <Text style={styles.noteText}>Ket: {item.note}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerContainer: {
    backgroundColor: "#2563EB",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
  iconBtn: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
  },
  headerInfo: { marginTop: 20 },
  labelWelcome: { color: "#BFDBFE", fontSize: 14 },
  labelCount: { color: "white", fontSize: 30, fontWeight: "bold" },
  bodyContainer: { flex: 1, marginTop: -30, paddingHorizontal: 20 },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customerName: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  timeText: { fontSize: 12, color: "#6B7280" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 12, fontWeight: "bold" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 12 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkInactive: { borderWidth: 2, borderColor: "#E5E7EB" },
  checkActive: { backgroundColor: "#10B981" },
  itemText: { fontSize: 15, color: "#374151" },
  textStrike: { textDecorationLine: "line-through", color: "#9CA3AF" },
  noteText: { fontSize: 12, color: "#EF4444", marginTop: 2 },
  emptyCard: {
    backgroundColor: "white",
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
  },
  emptyTitle: { marginTop: 10, color: "#9CA3AF", fontWeight: "500" },
});
