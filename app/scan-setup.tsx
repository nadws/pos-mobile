import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function ScanSetupScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return <View />;
  
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="camera-off" size={64} color="#D1D5DB" />
        <Text style={styles.permissionText}>Akses kamera diperlukan untuk scan QR Code toko.</Text>
        <TouchableOpacity style={styles.btnPermission} onPress={requestPermission}>
          <Text style={styles.btnText}>Berikan Izin</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const config = JSON.parse(data);
      
      // Validasi apakah ini QR Code POS kita
      if (config.slug && config.api_url) {
        
        // --- PERBAIKAN DI SINI ---
        await AsyncStorage.setItem("pos_store_slug", config.slug);
        await AsyncStorage.setItem("pos_api_url", config.api_url);
        
        // TAMBAHKAN BARIS INI: Simpan Nama Toko agar muncul di Dashboard
        await AsyncStorage.setItem("pos_store_name", config.name); 
        
        Alert.alert("Berhasil", `Toko ${config.name} terhubung!`, [
          { 
            text: "Lanjut", 
            // Arahkan ke select-user, bukan replace langsung agar stack aman
            onPress: () => router.replace('/select-user') 
          }
        ]);
      } else {
        throw new Error("Format QR salah");
      }
    } catch (e) {
      Alert.alert("Error", "QR Code tidak valid.");
      setScanned(false); // Izinkan scan ulang jika gagal
    }
};

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        {/* OVERLAY GELAP DI SEKITAR AREA SCAN */}
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.focusedContainer}>
                {/* SUDUT BINGKAI NYALA */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                
                {/* GARIS SCANNING JALAN (ANIMASI BISA DITAMBAH NANTI) */}
                <View style={styles.scanLine} />
            </View>
            <View style={styles.unfocusedContainer}></View>
          </View>
          <View style={styles.bottomContainer}>
            <Text style={styles.instructionText}>
              Arahkan kamera ke QR Code di Dashboard Admin
            </Text>
            
            {/* Tombol Kembali ke Halaman Welcome */}
            <TouchableOpacity style={styles.btnBack} onPress={() => router.back()}>
              <Text style={styles.btnBackText}>Kembali</Text>
            </TouchableOpacity>
        </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  middleContainer: { flexDirection: 'row', height: 280 },
  focusedContainer: { width: 280, position: 'relative', backgroundColor: 'transparent' },
  bottomContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', paddingTop: 40 },
  
  // Design Bingkai
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#3B82F6', borderWidth: 5 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  
  scanLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: '#3B82F6', top: '50%', opacity: 0.5 },
  
  instructionText: { color: 'white', fontSize: 16, textAlign: 'center', paddingHorizontal: 40, marginBottom: 20 },
  permissionText: { color: '#9CA3AF', textAlign: 'center', marginVertical: 20, paddingHorizontal: 40 },
  btnPermission: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: 'white', fontWeight: 'bold' },
  btnBack: { marginTop: 20 },
  btnBackText: { color: '#9CA3AF', fontSize: 14, textDecorationLine: 'underline' }
});