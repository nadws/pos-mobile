import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

// Aktifkan animasi layout untuk Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  // State untuk memicu re-render timer setiap menit
  const [tick, setTick] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastOrderCount = useRef(0);

  // --- AUDIO & FETCH LOGIC (SAMA SEPERTI SEBELUMNYA) ---
  async function playNotificationSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: NOTIF_URL },
        { shouldPlay: true },
      );
    } catch (error) {
      console.log("Sound error", error);
    }
  }

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const slug = await AsyncStorage.getItem("pos_store_slug");
      const token = await AsyncStorage.getItem("pos_token");
      const apiUrl = "https://uwaispos.online/api";

      const response = await axios.get(`${apiUrl}/pos/${slug}/kitchen-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newOrders = response.data.data || []; // Sesuaikan struktur response API kamu

      if (
        newOrders.length > lastOrderCount.current &&
        lastOrderCount.current !== 0
      ) {
        playNotificationSound();
      }

      // Animasi halus saat data berubah
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      lastOrderCount.current = newOrders.length;
      setOrders(newOrders);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    intervalRef.current = setInterval(() => {
      fetchOrders(true);
    }, 10000);

    // Timer ticker setiap 1 menit untuk update tampilan "x menit lalu"
    const timerInterval = setInterval(() => setTick((t) => t + 1), 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(timerInterval);
    };
  }, []);

  const handleMarkItemReady = async (itemId: number) => {
    // Optimistic UI Update (Langsung update di layar biar cepat)
    setOrders((prevOrders) =>
      prevOrders.map((order) => ({
        ...order,
        items: order.items.map((item) =>
          item.id === itemId ? { ...item, status: "done" } : item,
        ),
      })),
    );

    try {
      const token = await AsyncStorage.getItem("pos_token");
      const apiUrl = await AsyncStorage.getItem("pos_api_url");
      // Tembak API mark item ready (sesuaikan endpoint di controller kamu yg kita buat tadi)
      // await axios.post(...)
      // Anggap sukses
    } catch (error) {
      console.error("Gagal update status");
      fetchOrders(true); // Revert jika gagal
    }
  };

  // Helper: Hitung Durasi (Menit)
  const getDuration = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    return minutes;
  };

  // Helper: Warna Header Card berdasarkan Durasi Nunggu
  const getCardColor = (minutes: number) => {
    if (minutes > 20) return "#EF4444"; // Merah (Lama > 20 mnt)
    if (minutes > 10) return "#F59E0B"; // Kuning (Medium > 10 mnt)
    return "#10B981"; // Hijau (Baru)
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />

      {/* HEADER COMPACT */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Kitchen Display</Text>
            <Text style={styles.headerSub}>{orders.length} Tiket Aktif</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => fetchOrders()}
          style={styles.refreshBtn}
        >
          <MaterialCommunityIcons name="refresh" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchOrders()}
            />
          }
        >
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="check-all"
                size={80}
                color="#D1D5DB"
              />
              <Text style={styles.emptyText}>Semua pesanan selesai!</Text>
              <Text style={styles.emptySub}>Kerja bagus, Chef.</Text>
            </View>
          ) : (
            orders.map((order) => {
              const mins = getDuration(order.created_at);
              const isLate = mins > 15;

              return (
                <View key={order.id} style={styles.card}>
                  {/* CARD HEADER: Warna Warni sesuai durasi */}
                  <View
                    style={[
                      styles.cardTop,
                      { borderLeftColor: getCardColor(mins) },
                    ]}
                  >
                    <View style={styles.cardInfo}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Text style={styles.invoiceText}>
                          #{order.id.toString().slice(-4)}
                        </Text>
                        {/* Badge Meja / Takeaway */}
                        <View
                          style={[
                            styles.badge,
                            order.table_number
                              ? styles.badgeDineIn
                              : styles.badgeTakeaway,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={
                              order.table_number
                                ? "table-furniture"
                                : "shopping"
                            }
                            size={12}
                            color={order.table_number ? "#1E40AF" : "#991B1B"}
                          />
                          <Text
                            style={[
                              styles.badgeText,
                              {
                                color: order.table_number
                                  ? "#1E40AF"
                                  : "#991B1B",
                              },
                            ]}
                          >
                            {order.table_number
                              ? `MEJA ${order.table_number}`
                              : "TAKEAWAY"}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.customerName}>
                        {order.customer_name}
                      </Text>
                    </View>

                    {/* TIMER POJOK KANAN */}
                    <View
                      style={[styles.timerBadge, isLate && styles.timerLate]}
                    >
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={14}
                        color={isLate ? "white" : "#4B5563"}
                      />
                      <Text
                        style={[styles.timerText, isLate && { color: "white" }]}
                      >
                        {mins} mnt
                      </Text>
                    </View>
                  </View>

                  {/* LIST ITEMS */}
                  <View style={styles.cardBody}>
                    {order.items.map((item, idx) => {
                      const isDone = item.status === "done";
                      return (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.7}
                          onPress={() =>
                            !isDone && handleMarkItemReady(item.id)
                          }
                          style={[styles.itemRow, isDone && styles.itemRowDone]}
                        >
                          {/* QTY BOX - FOKUS UTAMA */}
                          <View
                            style={[
                              styles.qtyBox,
                              isDone ? styles.qtyDone : styles.qtyActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.qtyText,
                                isDone && { color: "#9CA3AF" },
                              ]}
                            >
                              {item.quantity}
                            </Text>
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.productName,
                                isDone && styles.textStrike,
                              ]}
                            >
                              {item.product?.name ||
                                item.product_name ||
                                "Item dihapus"}
                            </Text>
                            {/* NOTES HIGHLIGHT */}
                            {item.note && (
                              <View style={styles.noteBox}>
                                <MaterialCommunityIcons
                                  name="alert-circle-outline"
                                  size={14}
                                  color="#B91C1C"
                                />
                                <Text style={styles.noteText}>{item.note}</Text>
                              </View>
                            )}
                          </View>

                          {/* CHECKBOX VISUAL */}
                          <View
                            style={[
                              styles.checkBox,
                              isDone ? styles.checkDone : styles.checkPending,
                            ]}
                          >
                            {isDone && (
                              <MaterialCommunityIcons
                                name="check"
                                size={16}
                                color="white"
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E5E7EB" }, // Abu-abu background biar kartu pop-up
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    backgroundColor: "#1E40AF",
    padding: 16,
    paddingTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
  headerSub: { color: "#BFDBFE", fontSize: 12 },
  refreshBtn: { backgroundColor: "white", padding: 8, borderRadius: 20 },

  scrollContent: { padding: 12, paddingBottom: 80 },

  // Empty State
  emptyState: { alignItems: "center", marginTop: 100, opacity: 0.7 },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4B5563",
    marginTop: 16,
  },
  emptySub: { fontSize: 14, color: "#6B7280" },

  // Card Styles
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },

  // Card Top (Header Kartu)
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderLeftWidth: 6, // Garis warna indikator durasi
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cardInfo: { flex: 1 },
  invoiceText: { fontSize: 16, fontWeight: "900", color: "#111827" },
  customerName: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 2,
    fontWeight: "500",
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    gap: 4,
  },
  badgeDineIn: { backgroundColor: "#DBEAFE" },
  badgeTakeaway: { backgroundColor: "#FEE2E2" },
  badgeText: { fontSize: 10, fontWeight: "bold" },

  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  timerLate: { backgroundColor: "#EF4444" },
  timerText: { fontSize: 12, fontWeight: "bold", color: "#374151" },

  // Card Body (List Items)
  cardBody: { padding: 12 },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  itemRowDone: { opacity: 0.5 },

  // QTY Box (Kotak Jumlah)
  qtyBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  qtyActive: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  qtyDone: { backgroundColor: "#F3F4F6" },
  qtyText: { fontSize: 18, fontWeight: "bold", color: "#2563EB" },

  // Product Info
  productName: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  textStrike: { textDecorationLine: "line-through", color: "#9CA3AF" },

  // Notes / Catatan (Penting!)
  noteBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    gap: 4,
  },
  noteText: {
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "500",
    fontStyle: "italic",
  },

  // Checkbox Button
  checkBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  checkPending: { borderWidth: 2, borderColor: "#E5E7EB" },
  checkDone: { backgroundColor: "#10B981" },
});
