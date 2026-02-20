import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function ReportsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const slug = await AsyncStorage.getItem("pos_store_slug");
      const token = await AsyncStorage.getItem("pos_token");

      const response = await axios.get(
        `https://uwaispos.online/api/pos/${slug}/reports`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setReportData(response.data.data);
    } catch (error) {
      console.error("Gagal ambil laporan:", error);
    } finally {
      setLoading(false);
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

  // Persiapan data grafik dari API
  const chartData = {
    labels:
      reportData?.chart_labels?.length > 0
        ? reportData.chart_labels
        : ["Mon", "Tue", "Wed"],
    datasets: [
      {
        data:
          reportData?.chart_values?.length > 0
            ? reportData.chart_values
            : [0, 0, 0],
        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#2563EB"
        translucent
      />

      {/* HEADER BIRU MELENGKUNG */}
      <View style={styles.header}>
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Laporan Penjualan</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>Total Omzet Minggu Ini</Text>
          <Text style={styles.headerValue}>
            {formatRp(reportData?.weekly_revenue)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* GRAFIK TREN */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tren Penjualan (7 Hari Terakhir)</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        </View>

        {/* STATISTIK */}
        <View style={styles.statsGrid}>
          <View style={styles.statsCard}>
            <View style={[styles.iconBox, { backgroundColor: "#ECFDF5" }]}>
              <MaterialCommunityIcons
                name="cart-check"
                size={24}
                color="#10B981"
              />
            </View>
            <Text style={styles.statsLabel}>Total Pesanan</Text>
            <Text style={styles.statsValue}>{reportData?.total_orders}</Text>
          </View>
          <View style={styles.statsCard}>
            <View style={[styles.iconBox, { backgroundColor: "#EFF6FF" }]}>
              <MaterialCommunityIcons
                name="account-group"
                size={24}
                color="#2563EB"
              />
            </View>
            <Text style={styles.statsLabel}>Pelanggan</Text>
            <Text style={styles.statsValue}>{reportData?.new_customers}</Text>
          </View>
        </View>

        {/* MENU TERLARIS (DINAMIS DARI API) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Menu Terlaris</Text>
          {reportData?.top_products?.map((item: any, index: number) => (
            <View key={index} style={styles.rankRow}>
              <View style={styles.rankInfo}>
                <View
                  style={[
                    styles.rankDot,
                    { backgroundColor: index === 0 ? "#FACC15" : "#2563EB" },
                  ]}
                />
                <Text style={styles.rankName}>{item.product_name}</Text>
              </View>
              <Text style={styles.rankQty}>{item.total_qty} Porsi</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// Konfigurasi Chart
const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: "5", strokeWidth: "2", stroke: "#2563EB" },
};

// Styles (sama seperti sebelumnya agar senada dengan dashboard)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: "#2563EB",
    paddingTop: 50,
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
  backBtn: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
  },
  navTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
  headerContent: { marginTop: 20, alignItems: "center" },
  headerLabel: { color: "#BFDBFE", fontSize: 14 },
  headerValue: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 5,
  },
  body: { flex: 1, marginTop: -30, paddingHorizontal: 20 },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statsLabel: { fontSize: 12, color: "#6B7280" },
  statsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 4,
  },
  rankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  rankInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  rankDot: { width: 8, height: 8, borderRadius: 4 },
  rankName: { color: "#4B5563", fontSize: 14, fontWeight: "500" },
  rankQty: { fontWeight: "bold", color: "#111827" },
});
