import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

export default function PaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // --- STATE ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris">("cash");
  const [cashGiven, setCashGiven] = useState("");
  const [change, setChange] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [storeName, setStoreName] = useState("Toko Saya");
  const [invoiceNum, setInvoiceNum] = useState("");

  // --- LOAD DATA ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedCart = await AsyncStorage.getItem("pos_cart");
      const savedStore = await AsyncStorage.getItem("pos_store_name");
      if (savedStore) setStoreName(savedStore);

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        const total = parsedCart.reduce(
          (acc: number, item: CartItem) => acc + item.price * item.qty,
          0,
        );
        setTotalAmount(total);
      } else {
        router.back();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- FORMATTER ---
  const formatRp = (num: number) => "Rp " + num.toLocaleString("id-ID");

  // Fungsi untuk memformat input angka dengan separator ribuan
  const formatInputNumber = (text: string) => {
    const cleanNumber = text.replace(/\D/g, ""); // Hapus semua karakter non-angka
    if (cleanNumber === "") return "";
    return parseInt(cleanNumber).toLocaleString("id-ID");
  };

  // --- HITUNG KEMBALIAN ---
  useEffect(() => {
    const rawCash = parseInt(cashGiven.replace(/\./g, "")) || 0; // Hapus titik sebelum hitung
    if (paymentMethod === "cash") {
      setChange(rawCash - totalAmount);
    } else {
      setChange(0);
    }
  }, [cashGiven, totalAmount, paymentMethod]);

  // --- FUNGSI PRINT ---
  const handlePrintBill = async () => {
    const date = new Date().toLocaleString("id-ID");
    const html = `
        <html>
          <body style="font-family: monospace; padding: 20px; text-align: center;">
            <h2>${storeName}</h2>
            <hr/>
            <div style="text-align: left;">
              <p>No: ${invoiceNum || "INV-TEMP"}</p>
              <p>Tgl: ${date}</p>
            </div>
            <table style="width: 100%;">
              ${cart
                .map(
                  (item) => `
                <tr>
                  <td style="text-align: left;">${item.name} x ${item.qty}</td>
                  <td style="text-align: right;">${(
                    item.price * item.qty
                  ).toLocaleString()}</td>
                </tr>
              `,
                )
                .join("")}
            </table>
            <hr/>
            <div style="display: flex; justify-content: space-between; font-weight: bold;">
              <span>TOTAL</span>
              <span>${formatRp(totalAmount)}</span>
            </div>
            <p>TERIMA KASIH</p>
          </body>
        </html>`;
    try {
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert("Error", "Gagal mencetak struk");
    }
  };

  const handleProcessPayment = async () => {
    // 1. Validasi Input Uang (Hanya untuk Cash)
    const rawCash = parseInt(cashGiven.replace(/\./g, "")) || 0;
    if (paymentMethod === "cash" && rawCash < totalAmount) {
      Alert.alert("Gagal", "Uang tunai kurang!");
      return;
    }

    setIsProcessing(true);

    try {
      // 2. Ambil Data Session
      const slug = await AsyncStorage.getItem("pos_store_slug");
      const token = await AsyncStorage.getItem("pos_token");
      // Ambil URL API yang tersimpan saat Login (Biar sinkron sama index.tsx)
      // Default fallback ke domain live kalau null
      const baseUrl = "https://uwaispos.online/api";

      // Cek Debugging di Console (Lihat terminal Metro Bundler)
      console.log("DEBUG TRANSAKSI:");
      console.log("URL:", `${baseUrl}/pos/${slug}/checkout`);
      console.log("Token:", token ? "Ada" : "KOSONG!");
      console.log("Slug:", slug);

      if (!slug || !token) {
        Alert.alert("Error", "Sesi toko hilang. Silakan login ulang.");
        return;
      }

      // 3. Siapkan Payload
      const payload = {
        customer_name: "Pelanggan Umum",
        payment_method: paymentMethod,
        // Kirim juga uang diterima & kembalian untuk catatan database
        money_received: paymentMethod === "cash" ? rawCash : totalAmount,
        change: paymentMethod === "cash" ? change : 0,
        items: cart.map((item) => ({
          id: item.id,
          qty: item.qty,
          price: item.price,
        })),
      };

      // 4. TEMBAK API (Dengan Header Lengkap)
      const response = await axios.post(
        `${baseUrl}/pos/${slug}/checkout`, // Sesuai route kamu: /pos/{slug}/checkout
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json", // <--- WAJIB BUAT LARAVEL
            "Content-Type": "application/json",
          },
        },
      );

      console.log("SUKSES:", response.data);

      // 5. Simpan No Invoice & Bersihkan Keranjang
      if (response.data?.order?.invoice_number) {
        setInvoiceNum(response.data.order.invoice_number);
      }

      await AsyncStorage.removeItem("pos_cart");
      setSuccessModal(true);
    } catch (error: any) {
      console.error("ERROR AXIOS:", error);

      // BACA PESAN ERROR DARI SERVER LARAVEL
      if (error.response) {
        console.log("Response Data:", error.response.data);
        console.log("Status Code:", error.response.status);

        if (error.response.status === 422) {
          // Error Validasi (Misal: Stok habis, atau data kurang)
          const msg = error.response.data.message;
          Alert.alert("Validasi Gagal", msg);
        } else if (error.response.status === 401) {
          Alert.alert("Gagal", "Sesi habis. Silakan Login Ulang.");
          router.replace("/select-user");
        } else if (error.response.status === 404) {
          Alert.alert("Gagal", "URL Salah. Pastikan route API benar.");
        } else {
          Alert.alert(
            "Gagal",
            error.response.data?.message || "Terjadi kesalahan server.",
          );
        }
      } else if (error.request) {
        Alert.alert(
          "Koneksi Error",
          "Tidak bisa menghubungi server. Cek internet/IP Address.",
        );
      } else {
        Alert.alert("Error", "Terjadi kesalahan aplikasi.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

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
          <Text style={styles.headerTitle}>Pembayaran</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.labelTotal}>Total Tagihan</Text>
          <Text style={styles.valueTotal}>{formatRp(totalAmount)}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            // 🔑 FIX UTAMA: ruang aman biar changeBox gak ketutup
            paddingBottom: 180 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* RINGKASAN PESANAN */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.summaryHeader}
            onPress={() => setShowSummary(!showSummary)}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <MaterialCommunityIcons
                name="receipt"
                size={22}
                color="#2563EB"
              />
              <Text style={styles.cardTitle}>Detail Pesanan</Text>
            </View>
            <MaterialCommunityIcons
              name={showSummary ? "chevron-up" : "chevron-down"}
              size={24}
              color="#9CA3AF"
            />
          </TouchableOpacity>
          {showSummary && (
            <View style={styles.summaryList}>
              {cart.map((item, idx) => (
                <View key={idx} style={styles.summaryItem}>
                  <Text style={styles.itemName}>
                    {item.qty}x {item.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {formatRp(item.price * item.qty)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* METODE PEMBAYARAN */}
        <Text style={styles.sectionTitle}>Pilih Metode</Text>
        <View style={styles.methodGrid}>
          <TouchableOpacity
            style={[
              styles.methodCard,
              paymentMethod === "cash" && styles.methodActive,
            ]}
            onPress={() => {
              setPaymentMethod("cash");
              setCashGiven("");
            }}
          >
            <MaterialCommunityIcons
              name="cash"
              size={28}
              color={paymentMethod === "cash" ? "#2563EB" : "#9CA3AF"}
            />
            <Text
              style={[
                styles.methodText,
                paymentMethod === "cash" && styles.methodTextActive,
              ]}
            >
              Tunai
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.methodCard,
              paymentMethod === "qris" && styles.methodActive,
            ]}
            onPress={() => setPaymentMethod("qris")}
          >
            <MaterialCommunityIcons
              name="qrcode-scan"
              size={24}
              color={paymentMethod === "qris" ? "#2563EB" : "#9CA3AF"}
            />
            <Text
              style={[
                styles.methodText,
                paymentMethod === "qris" && styles.methodTextActive,
              ]}
            >
              QRIS
            </Text>
          </TouchableOpacity>
        </View>

        {/* INPUT UANG TUNAI */}
        {paymentMethod === "cash" && (
          <View style={styles.cashSection}>
            <Text style={styles.labelInput}>Uang yang Diterima</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.prefix}>Rp</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                placeholder="0"
                value={cashGiven}
                onChangeText={(text) => setCashGiven(formatInputNumber(text))}
              />
            </View>

            <View style={styles.quickGrid}>
              {[50000, 100000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={styles.quickBtn}
                  onPress={() => setCashGiven(amt.toLocaleString("id-ID"))}
                >
                  <Text style={styles.quickBtnText}>{amt / 1000}k</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.uangPasBtn}
                onPress={() =>
                  setCashGiven(totalAmount.toLocaleString("id-ID"))
                }
              >
                <Text style={styles.uangPasText}>Uang Pas</Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.changeBox,
                change < 0 ? styles.changeRed : styles.changeGreen,
              ]}
            >
              <Text style={styles.changeLabel}>
                {change < 0 ? "Kurang" : "Kembalian"}
              </Text>
              <Text style={styles.changeValue}>
                {formatRp(Math.abs(change))}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Tombol Bayar Statis di Bawah */}
      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (isProcessing || (paymentMethod === "cash" && change < 0)) &&
              styles.payButtonDisabled,
          ]}
          onPress={handleProcessPayment}
          disabled={isProcessing || (paymentMethod === "cash" && change < 0)}
        >
          {isProcessing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.payButtonText}>PROSES PEMBAYARAN</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* MODAL SUKSES */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <MaterialCommunityIcons
              name="check-circle"
              size={80}
              color="#10B981"
            />
            <Text style={styles.successTitle}>Berhasil!</Text>
            <View style={styles.successDivider} />
            <TouchableOpacity style={styles.printBtn} onPress={handlePrintBill}>
              <MaterialCommunityIcons
                name="printer"
                size={20}
                color="#2563EB"
              />
              <Text style={styles.printText}>Cetak Struk</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.finishBtn}
              onPress={() => {
                setSuccessModal(false);
                router.replace("/pos");
              }}
            >
              <Text style={styles.finishText}>Transaksi Baru</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  blueHeader: {
    backgroundColor: "#2563EB",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 10 : 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  navBtn: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
  },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
  headerInfo: { alignItems: "center", marginTop: 10 },
  labelTotal: { color: "#BFDBFE", fontSize: 14 },
  valueTotal: { color: "white", fontSize: 32, fontWeight: "bold" },

  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#1F2937" },
  summaryList: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemName: { color: "#4B5563", fontSize: 14 },
  itemPrice: { fontWeight: "600", color: "#1F2937" },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
    marginLeft: 5,
  },
  methodGrid: { flexDirection: "row", gap: 12, marginBottom: 25 },
  methodCard: {
    flex: 1,
    height: 90,
    backgroundColor: "white",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    elevation: 1,
  },
  methodActive: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  methodText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  methodTextActive: { color: "#2563EB" },

  cashSection: { marginTop: 5 },
  labelInput: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
    marginLeft: 5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 65,
    elevation: 1,
  },
  prefix: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#9CA3AF",
    marginRight: 8,
  },
  input: { flex: 1, fontSize: 24, fontWeight: "bold", color: "#1F2937" },

  quickGrid: { flexDirection: "row", gap: 10, marginTop: 15 },
  quickBtn: {
    flex: 1,
    backgroundColor: "white",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    elevation: 1,
  },
  quickBtnText: { fontWeight: "bold", color: "#4B5563" },
  uangPasBtn: {
    flex: 2,
    backgroundColor: "#DBEAFE",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  uangPasText: { color: "#2563EB", fontWeight: "bold" },

  changeBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 16,
    marginTop: 20,
  },
  changeGreen: { backgroundColor: "#D1FAE5" },
  changeRed: { backgroundColor: "#FEE2E2" },
  changeLabel: { fontWeight: "bold", color: "#374151" },
  changeValue: { fontSize: 20, fontWeight: "bold", color: "#1F2937" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  payButton: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  payButtonDisabled: { backgroundColor: "#9CA3AF" },
  payButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successCard: {
    backgroundColor: "white",
    width: "100%",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 10,
  },
  successDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 20,
  },
  printBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 15,
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2563EB",
    justifyContent: "center",
    marginBottom: 12,
  },
  printText: { color: "#2563EB", fontWeight: "bold" },
  finishBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 15,
    width: "100%",
    borderRadius: 12,
    alignItems: "center",
  },
  finishText: { color: "white", fontWeight: "bold" },
});
