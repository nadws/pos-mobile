import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function PinAuthScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pin.length === 6) {
      handleVerifyPin();
    }
  }, [pin]);

  const handlePress = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleVerifyPin = async () => {
    setLoading(true);
    const apiUrl = "https://uwaispos.online/api";

    try {
      const response = await axios.post(`${apiUrl}/pos/verify-pin`, {
        user_id: id,
        pin: pin,
      });

      if (response.data.success) {
        await AsyncStorage.setItem("pos_token", response.data.token);
        await AsyncStorage.setItem("pos_user_name", name as string);
        router.replace("/home");
      }
    } catch (error: any) {
      Alert.alert("Akses Ditolak", "PIN yang Anda masukkan salah.");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  // Komponen Tombol Angka (Glassmorphism Style)
  const NumButton = ({
    number,
    onPress,
  }: {
    number: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.btnText}>{number}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={["#1E40AF", "#3B82F6"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      <SafeAreaView style={styles.safeArea}>
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.lockIconContainer}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={32}
              color="white"
            />
          </View>
          <Text style={styles.title}>Halo, {name || "Kasir"}!</Text>
          <Text style={styles.subtitle}>Masukkan PIN Keamanan</Text>
        </View>

        {/* PIN DOTS INDICATOR */}
        <View style={styles.dotsContainer}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[styles.dot, pin.length > i ? styles.dotActive : null]}
            />
          ))}
        </View>

        {/* LOADING INDICATOR */}
        <View style={{ height: 40, justifyContent: "center" }}>
          {loading && <ActivityIndicator color="white" size="large" />}
        </View>

        {/* NUMPAD GRID */}
        <View style={styles.numpadContainer}>
          <View style={styles.row}>
            <NumButton number="1" onPress={() => handlePress("1")} />
            <NumButton number="2" onPress={() => handlePress("2")} />
            <NumButton number="3" onPress={() => handlePress("3")} />
          </View>
          <View style={styles.row}>
            <NumButton number="4" onPress={() => handlePress("4")} />
            <NumButton number="5" onPress={() => handlePress("5")} />
            <NumButton number="6" onPress={() => handlePress("6")} />
          </View>
          <View style={styles.row}>
            <NumButton number="7" onPress={() => handlePress("7")} />
            <NumButton number="8" onPress={() => handlePress("8")} />
            <NumButton number="9" onPress={() => handlePress("9")} />
          </View>
          <View style={styles.row}>
            {/* Tombol Kosong agar 0 di tengah */}
            <View style={styles.btnEmpty} />

            <NumButton number="0" onPress={() => handlePress("0")} />

            <TouchableOpacity style={styles.btnControl} onPress={handleDelete}>
              <MaterialCommunityIcons
                name="backspace-outline"
                size={28}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* FOOTER BUTTON */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.footerLink}
        >
          <Text style={styles.footerText}>Ganti Akun</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Header Styles
  header: { alignItems: "center", marginBottom: 30 },
  lockIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)", // Transparan
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  title: { fontSize: 24, fontWeight: "bold", color: "white", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#BFDBFE" }, // Biru Muda

  // PIN Dots Styles
  dotsContainer: { flexDirection: "row", marginBottom: 20, gap: 12 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "transparent",
  },
  dotActive: {
    backgroundColor: "white",
    borderColor: "white",
    elevation: 5,
    shadowColor: "white",
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },

  // Numpad Styles
  numpadContainer: { width: "85%", maxWidth: 350 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  btn: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: "rgba(255,255,255,0.15)", // Glass effect
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  btnText: { fontSize: 32, fontWeight: "600", color: "white" },

  btnEmpty: { width: 75, height: 75 },
  btnControl: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: 'transparent'
  },

  // Footer
  footerLink: { marginTop: 20, padding: 10 },
  footerText: { color: "#BFDBFE", fontSize: 14, fontWeight: "600" },
});
